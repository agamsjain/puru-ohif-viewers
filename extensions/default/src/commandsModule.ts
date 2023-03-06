import { DicomMetadataStore, ServicesManager } from '@ohif/core';

import DicomTagBrowser from './DicomTagBrowser/DicomTagBrowser';
import reuseCachedLayouts from './utils/reuseCachedLayouts';
import findViewportsByPosition, {
  findOrCreateViewport as layoutFindOrCreate,
} from './findViewportsByPosition';

export type HangingProtocolParams = {
  protocolId?: string;
  stageIndex?: number;
  activeStudyUID?: string;
  stageId?: string;
};

const commandsModule = ({ servicesManager, commandsManager }) => {
  const {
    measurementService,
    hangingProtocolService,
    uiNotificationService,
    viewportGridService,
    displaySetService,
    stateSyncService,
    toolbarService,
  } = (servicesManager as ServicesManager).services;

  const actions = {
    displayNotification: ({ text, title, type }) => {
      uiNotificationService.show({
        title: title,
        message: text,
        type: type,
      });
    },
    clearMeasurements: () => {
      measurementService.clear();
    },

    /** Toggles off all tools which contain a HP setter and don't match
     * the HP id/stageId/index, as well as all tools mark as isVolume, which
     * when isVolume is false.
     */
    toggleHpTools: ({
      isVolume = false,
      protocol,
      stageIndex: toggleStageIndex,
      stage,
    }) => {
      const active = toolbarService.getActiveTools();
      const enableListener = button => {
        if (!button.id) return;
        const { commands, items, volumeDeactivate } = button.props || button;
        if (volumeDeactivate && !isVolume) {
          if (active.indexOf(button.id) !== -1) {
            toolbarService.recordInteraction(volumeDeactivate);
          }
        }
        if (items) {
          items.forEach(enableListener);
        }
        const hpCommand = commands?.find?.(
          it => it?.commandName && it.commandName.indexOf('Hanging') !== -1
        );
        if (hpCommand) {
          const { protocolId, stageIndex, stageId } = hpCommand.commandOptions;
          let isActive = true;
          if (protocolId !== undefined && protocolId !== protocol.id) {
            isActive = false;
          }
          if (stageIndex !== undefined && stageIndex !== toggleStageIndex) {
            isActive = false;
          }
          if (stageId && stageId !== stage.id) {
            isActive = false;
          }
          toolbarService.setActive(button.id, isActive);
        }
      };
      Object.values(toolbarService.getButtons()).forEach(enableListener);
    },

    /**
     *  Sets the specified protocol
     *    1. Records any existing state using the viewport grid service
     *    2. Finds the destination state - this can be one of:
     *       a. The specified protocol stage
     *       b. An alternate (toggled or restored) protocol stage
     *       c. A restored custom layout
     *    3. Finds the parameters for the specified state
     *       a. Gets the reuseIdMap
     *       b. Gets the map by position
     *       c. Gets any toggle mapping to map position to/from current view
     *    4. If restore, then sets layout
     *       a. Maps viewport position by currently displayed viewport map id
     *       b. Uses toggle information to map display set id
     *    5. Else applies the hanging protocol
     *       a. HP Service is provided reuseIdMap
     *       b. HP Service will ignore any reuseId instances which don't apply
     *       c. HP Service will throw an exception if it isn't applicable
     * @param options - contains information on the HP to apply
     * @param options.activeStudyUID - the updated study to apply the HP to
     * @param options.protocolId - the protocol ID to change to
     * @param options.stageId - the stageId to apply
     * @param options.stageIndex - the index of the stage to go to.
     */
    setHangingProtocol: ({
      activeStudyUID = '',
      protocolId,
      stageId,
      stageIndex,
    }: HangingProtocolParams): boolean => {
      try {
        // Stores in the state the reuseID to displaySetUID mapping
        // Pass in viewportId for the active viewport.  This item will get set as
        // the activeViewportId
        const state = viewportGridService.getState();
        const hpInfo = hangingProtocolService.getState();
        const stateSyncReduce = reuseCachedLayouts(
          state,
          hangingProtocolService,
          stateSyncService
        );
        const { hanging, viewportGridStore, reuseIdMap } = stateSyncReduce;

        if (!protocolId) {
          // Re-use the previous protocol id, and optionally stage
          protocolId = hpInfo.protocolId;
          if (stageId === undefined && stageIndex === undefined) {
            stageIndex = hpInfo.stageIndex;
          }
        } else if (stageIndex === undefined && stageId === undefined) {
          // Re-set the same stage as was previously used
          const hangingId = `${activeStudyUID ||
            hpInfo.activeStudyUID}:${protocolId}`;
          stageIndex = hanging[hangingId]?.stageIndex;
        }

        const useStageIdx =
          stageIndex ??
          hangingProtocolService.getStageIndex(protocolId, {
            stageId,
            stageIndex,
          });

        if (activeStudyUID) {
          hangingProtocolService.setActiveStudyUID(activeStudyUID);
        }

        const storedHanging = `${hangingProtocolService.getState().activeStudyUID
        }:${protocolId}:${useStageIdx || 0}`;

        const restoreProtocol = !!viewportGridStore[storedHanging];

        if (
          protocolId === hpInfo.hangingProtocolId &&
          useStageIdx === hpInfo.stageIdx &&
          !activeStudyUID
        ) {
          // Clear the HP setting to reset them
          hangingProtocolService.setProtocol(protocolId, {
            stageId,
            stageIndex: useStageIdx,
          });
        } else {
          hangingProtocolService.setProtocol(protocolId, {
            reuseIdMap,
            stageId,
            stageIndex: useStageIdx,
            restoreProtocol,
          });
          if (restoreProtocol) {
            viewportGridService.restoreCachedLayout(
              viewportGridStore[storedHanging]
            );
          }
        }
        // Do this after successfully applying the update
        stateSyncService.reduce(stateSyncReduce);
        actions.toggleHpTools(hangingProtocolService.getActiveProtocol());
        return true;
      } catch (e) {
        actions.toggleHpTools(hangingProtocolService.getActiveProtocol());
        uiNotificationService.show({
          title: 'Apply Hanging Protocol',
          message: `The hanging protocol could not be applied due to ${e}`,
          type: 'error',
          duration: 3000,
        });
        return false;
      }
    },

    toggleHangingProtocol: ({
      protocolId,
      stageIndex,
    }: HangingProtocolParams): boolean => {
      const {
        protocol,
        stageIndex: desiredStageIndex,
        activeStudy,
      } = hangingProtocolService.getActiveProtocol();
      const { toggleHangingProtocol } = stateSyncService.getState();
      const storedHanging = `${activeStudy.StudyInstanceUID
        }:${protocolId}:${stageIndex | 0}`;
      if (
        protocol.id === protocolId &&
        (stageIndex === undefined || stageIndex === desiredStageIndex)
      ) {
        // Toggling off - restore to previous state
        const previousState = toggleHangingProtocol[storedHanging] || {
          protocolId: 'default',
        };
        return actions.setHangingProtocol(previousState);
      } else {
        stateSyncService.reduce({
          toggleHangingProtocol: {
            ...toggleHangingProtocol,
            [storedHanging]: {
              protocolId: protocol.id,
              stageIndex: desiredStageIndex,
            },
          },
        });
        return actions.setHangingProtocol({ protocolId, stageIndex });
      }
    },

    deltaStage: ({ direction }) => {
      const {
        protocolId,
        stageIndex: oldStageIndex,
      } = hangingProtocolService.getState();
      const { protocol } = hangingProtocolService.getActiveProtocol();
      for (
        let stageIndex = oldStageIndex + direction;
        stageIndex >= 0 && stageIndex < protocol.stages.length;
        stageIndex += direction
      ) {
        if (protocol.stages[stageIndex].status !== 'disabled') {
          return actions.setHangingProtocol({
            protocolId,
            stageIndex,
          });
        }
      }
      uiNotificationService.show({
        title: 'Change Stage',
        message: 'The hanging protocol has no more applicable stages',
        type: 'error',
        duration: 3000,
      });
    },

    /**
     * Changes the viewport grid layout in terms of the MxN layout.
     */
    setViewportGridLayout: ({ numRows, numCols }) => {
      const state = viewportGridService.getState();
      const stateReduce = findViewportsByPosition(
        state,
        { numRows, numCols },
        stateSyncService
      );
      const findOrCreateViewport = layoutFindOrCreate.bind(
        null,
        hangingProtocolService,
        stateReduce.viewportsByPosition
      );

      viewportGridService.setLayout({
        numRows,
        numCols,
        findOrCreateViewport,
      });
      stateSyncService.reduce(stateReduce);
    },

    openDICOMTagViewer() {
      const { activeViewportIndex, viewports } = viewportGridService.getState();
      const activeViewportSpecificData = viewports[activeViewportIndex];
      const { displaySetInstanceUIDs } = activeViewportSpecificData;

      const displaySets = displaySetService.activeDisplaySets;
      const { UIModalService } = servicesManager.services;

      const displaySetInstanceUID = displaySetInstanceUIDs[0];
      UIModalService.show({
        content: DicomTagBrowser,
        contentProps: {
          displaySets,
          displaySetInstanceUID,
          onClose: UIModalService.hide,
        },
        title: 'DICOM Tag Browser',
      });
    },
  };

  const definitions = {
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
      storeContexts: [],
      options: {},
    },
    displayNotification: {
      commandFn: actions.displayNotification,
      storeContexts: [],
      options: {},
    },
    setHangingProtocol: {
      commandFn: actions.setHangingProtocol,
      storeContexts: [],
      options: {},
    },
    toggleHangingProtocol: {
      commandFn: actions.toggleHangingProtocol,
      storeContexts: [],
      options: {},
    },
    nextStage: {
      commandFn: actions.deltaStage,
      storeContexts: [],
      options: { direction: 1 },
    },
    previousStage: {
      commandFn: actions.deltaStage,
      storeContexts: [],
      options: { direction: -1 },
    },
    setViewportGridLayout: {
      commandFn: actions.setViewportGridLayout,
      storeContexts: [],
      options: {},
    },
    openDICOMTagViewer: {
      commandFn: actions.openDICOMTagViewer,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
