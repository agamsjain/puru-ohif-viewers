import { HangingProtocolService, StateSyncService, Types } from '@ohif/core';

type HPInfo = Types.HangingProtocol.HPInfo;

/**
 * Calculates a set of state information for hanging protocols and viewport grid
 * which defines the currently applied hanging protocol state.
 * @param state is the viewport grid state
 * @param syncService is the state sync service to use for getting existing state
 * @returns Set of states that can be applied to the state sync to remember
 *   the current view state.
 */
const reuseCachedLayout = (
  state,
  hangingProtocolService: HangingProtocolService,
  syncService: StateSyncService
): Record<string, Record<string, unknown>> => {
  const { activeViewportIndex, viewports, layout } = state;
  const hpInfo = hangingProtocolService.getHPInfo();
  const { protocolId, stageIndex, activeStudyUID } = hpInfo;
  const { protocol } = hangingProtocolService.getActiveProtocol();
  const stage = protocol.stages[stageIndex];
  const storeId = `${activeStudyUID}:${protocolId}:${stageIndex}`;
  const syncState = syncService.getState();
  const cacheId = `${activeStudyUID}:${protocolId}`;
  const viewportGridStore = { ...syncState.viewportGridStore };
  const hanging = { ...syncState.hanging };
  const reuseIdMap = { ...syncState.reuseIdMap };
  const { rows, cols } = stage.viewportStructure.properties;
  const custom =
    stage.viewports.length !== state.viewports.length ||
    state.layout.numRows !== rows ||
    state.layout.numCols !== cols;

  hanging[cacheId] = hpInfo;

  if (storeId && custom) {
    viewportGridStore[storeId] = { ...state };
  }

  for (let idx = 0; idx < state.viewports.length; idx++) {
    const viewport = state.viewports[idx];
    const { displaySetOptions, displaySetInstanceUIDs } = viewport;
    if (!displaySetOptions) continue;
    for (let i = 0; i < displaySetOptions.length; i++) {
      const displaySetUID = displaySetInstanceUIDs[i];
      if (!displaySetUID) continue;
      if (idx === activeViewportIndex && i === 0) {
        reuseIdMap[`${activeStudyUID}:activeDisplaySet`] = displaySetUID;
      }
      const reuseId = displaySetOptions[i]?.reuseId;
      if (reuseId) {
        reuseIdMap[`${activeStudyUID}:${reuseId}`] = displaySetUID;
      }
    }
  }

  return { hanging, viewportGridStore, reuseIdMap };
};

export default reuseCachedLayout;
