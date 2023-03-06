import { StateSyncService, Types } from '@ohif/core';

/**
 * This find or create viewport is paired with the reduce results from
 * below, and the action of this viewport is to look for previously filled
 * viewports, and to re-use by position id.  If there is no filled viewport,
 * then one can be re-used from the display set if it isn't going to be displayed.
 */
export const findOrCreateViewport = (
  hangingProtocolService,
  viewportsByPosition,
  viewportIdx,
  positionId,
  options
) => {
  const byPositionViewport = viewportsByPosition?.[positionId];
  if (byPositionViewport) return { ...byPositionViewport };
  const { protocolId, stageIndex } = hangingProtocolService.getHPInfo();

  // Setup the initial in display correctly for initial view/select
  if (!options.inDisplay) {
    options.inDisplay = [...viewportsByPosition.initialInDisplay];
  }
  // See if there is a default viewport for new views.
  const missing = hangingProtocolService.getMissingViewport(
    protocolId,
    stageIndex,
    positionId,
    options
  );
  if (missing) {
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

/**
 * Records the information on what viewports are displayed in which position.
 * Also records what instances from the existing positions are going to be in
 * view initially.
 * @param state is the viewport grid state
 * @param syncService is the state sync service to use for getting existing state
 * @returns Set of states that can be applied to the state sync to remember
 *   the current view state.
 */
const findViewportsByPosition = (
  state,
  { numRows, numCols },
  syncService: StateSyncService
): Record<string, Record<string, unknown>> => {
  const { viewports } = state;
  const syncState = syncService.getState();
  const viewportsByPosition = { ...syncState.viewportsByPosition };
  const initialInDisplay = [];

  for (const viewport of viewports) {
    if (viewport.positionId) {
      const storedViewport = {
        ...viewport,
        viewportOptions: { ...viewport.viewportOptions },
      };
      viewportsByPosition[viewport.positionId] = storedViewport;
      // The cache doesn't store the viewport options - it is only useful
      // for remembering the type of viewport and UIDs
      delete storedViewport.viewportId;
      delete storedViewport.viewportOptions.viewportId;
    }
  }

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const pos = col + row * numCols;
      const positionId = viewports?.[pos]?.positionId || `${col}-${row}`;
      const viewport = viewportsByPosition[positionId];
      if (viewport?.displaySetInstanceUIDs) {
        initialInDisplay.push(...viewport.displaySetInstanceUIDs);
      }
    }
  }

  // Store the initially displayed elements
  viewportsByPosition.initialInDisplay = initialInDisplay;

  return { viewportsByPosition };
};

export default findViewportsByPosition;
