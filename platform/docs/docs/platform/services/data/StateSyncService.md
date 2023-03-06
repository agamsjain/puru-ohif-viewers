---
sidebar_position: 4
sidebar_label: State Sync Service
---

# State Sync Service

## Overview
The state sync service is designed to allow short and long term memory of things such as
annotations applied, last annotation state, hanging protocol viewport state,
window level etc.  This allows for better interaction with things like navigation
between hanging protocols, ensuring that the previously displayed layouts
can be redisplayed after returning to a given hanging protocol.

Currently there are only two configured states, the mode based ones and the
application lifetime states.  The intent is to allow other lifetime basis
to be configured, for example, browser local store lifetime.

## Events

Currently the service does not fire events.

## API

- `register`: to create a new named state storage
- `reduce`: to apply a set of changes to several states at once
- `getState`: to retrieve the current state
- `onModeExit`: to clear the modal states (called on mode exit)

### register
THe register call is typically added to an extension to create a new
syncable state.  A typical call is shown below, registering the viewport
grid store state as a modal state.

```javascript
  stateSyncService.register('viewportGridStore', { isMode: true });
```

### getState
The `getState` call returns an object containing all of the reigstered states,
by id.  The values can be read directly, but should not be modified.

### reduce
The `reduce` call is used to apply a set of updates to various states.  The
updates are performed for every state as a simply "set" call.

### onModeExit
When the Mode is exited, the onModeExit is called on the sync state, and this
clears all states registered with `isMode: true`.  To avoid clearing the state,
the mode definition should store any transient state in the mode onModeExit
and recover it in the `mode.onModeEnter`.

## OHIF Registered State
There are a number of defined states here.  It is recommended to update this
list as states are added:

* `viewportGridStore` has viewport grid restore information for returning to an earlier grid layout.
* `reuseIdMap` has a map of names to display sets for preserving user changes to hp display set selections.
* `hanging` has a map of the hanging protocol stage information applied (HPInfo)
* `presentationSync` has the cornerstone presentation state information
* `toggleHangingProtocol` has the previously applied hanging protocol, to toggle an HP off.
* `querySync` has the previously applied query information.  Not fully implemented yet.
