import { DicomMetadataStore, ServicesManager } from '@ohif/core';

import DicomTagBrowser from './DicomTagBrowser/DicomTagBrowser';
import reuseCachedLayouts from './reuseCachedLayouts';

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
        const { hpInfo } = state;
        const { reuseIdMap, viewportGridStore, hanging } = reuseCachedLayouts(
          state,
          stateSyncService
        );

        if (!protocolId) {
          // Re-use the previous protocol id, and optionally stage
          protocolId = hpInfo.hangingProtocolId;
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
          const activeStudy = DicomMetadataStore.getStudy(activeStudyUID);
          activeStudy && hangingProtocolService.setActiveStudy(activeStudy);
        }

        const storedHanging = `${hangingProtocolService.getActiveProtocol().activeStudyUID
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
          console.log('Setting protocol', JSON.stringify(reuseIdMap));
          hangingProtocolService.setProtocol(protocolId, {
            reuseIdMap,
            stageId,
            stageIndex: useStageIdx,
            restoreProtocol,
          });
          if (restoreProtocol) {
            console.log('Restoring protocol', storedHanging);
            viewportGridService.restoreCachedLayout(
              viewportGridStore[storedHanging]
            );
          }
        }
        return true;
      } catch (e) {
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
        stage,
        activeStudyUID,
      } = hangingProtocolService.getActiveProtocol();
      const { toggleHangingProtocol } = stateSyncService.getState();
      const storedHanging = `${activeStudyUID}:${protocolId}:${stageIndex | 0}`;
      if (
        protocol.id === protocolId &&
        (stageIndex === undefined || stageIndex === stage)
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
            [storedHanging]: { protocolId: protocol.id, stageIndex: stage },
          },
        });
        return actions.setHangingProtocol({ protocolId, stageIndex });
      }
    },

    deltaStage: ({ direction }) => {
      const state = viewportGridService.getState();
      const { hangingProtocolId: protocolId, stageIdx } = state.hpInfo;
      const { protocol } = hangingProtocolService.getActiveProtocol();
      for (
        let stageIndex = stageIdx + direction;
        stageIndex >= 0 && stageIndex < protocol.stages.length;
        stageIndex += direction
      ) {
        if (protocol.stages[stageIndex].enable !== 'disabled') {
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

    previousStage: () => {
      const state = viewportGridService.getState();
      const { reuseIdMap } = reuseCachedLayouts(state, stateSyncService);
      // next stage in hanging protocols
      hangingProtocolService.previousProtocolStage({ reuseIdMap });
    },

    /**
     * Changes the viewport layout in terms of the MxN layout.
     */
    setViewportLayout: ({ numRows, numCols }) => {
      const state = viewportGridService.getState();
      const { hangingProtocolId, stageIdx } = state.hpInfo;

      const initialInDisplay = [];
      state.viewports.forEach(vp => {
        if (vp.displaySetInstanceUIDs) {
          initialInDisplay.push(...vp.displaySetInstanceUIDs);
        }
      });

      // The find or create viewport fills in missing viewports by first
      // looking for previously used viewports, by position, and secondly
      // by asking the hanging protocol service to provide a viewport.
      const findOrCreateViewport = (
        viewportIdx,
        positionId,
        cached,
        options
      ) => {
        const byPositionViewport = cached.byPosition?.[positionId];
        if (byPositionViewport) return { ...byPositionViewport };
        const missing = hangingProtocolService.getMissingViewport(
          hangingProtocolId,
          stageIdx,
          positionId,
          options
        );
        if (missing) {
          if (!options.inDisplay) {
            options.inDisplay = [...initialInDisplay];
          }
          const displaySetInstanceUIDs = missing.displaySetsInfo.map(
            it => it.displaySetInstanceUID
          );
          options.inDisplay.push(...displaySetInstanceUIDs);
          return {
            displaySetInstanceUIDs,
            displaySetOptions: missing.displaySetsInfo.map(
              it => it.displaySetOptions
            ),
            viewportOptions: {
              ...missing.viewportOptions,
            },
          };
        }
        return {};
      };

      viewportGridService.setLayout({ numRows, numCols, findOrCreateViewport });
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
    setViewportLayout: {
      commandFn: actions.setViewportLayout,
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
