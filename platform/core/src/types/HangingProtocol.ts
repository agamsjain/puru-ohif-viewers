export type DisplaySetInfo = {
  displaySetInstanceUID?: string;
  displaySetOptions: DisplaySetOptions;
};

export type ViewportMatchDetails = {
  viewportOptions: ViewportOptions;
  displaySetsInfo: DisplaySetInfo[];
};

export type DisplaySetMatchDetails = {
  StudyInstanceUID?: string;
  displaySetInstanceUID: string;
  matchDetails?: any;
  matchingScores?: DisplaySetMatchDetails[];
  sortingInfo?: any;
};

export type DisplaySetAndViewportOptions = {
  displaySetInstanceUIDs: string[];
  viewportOptions: ViewportOptions;
  displaySetOptions: DisplaySetOptions;
};

export type SetProtocolOptions = {
  /** Used to provide a mapping of what keys are provided for which viewport.
   * For example, a Chest XRay might use reuseId "ChestXRay", then
   * the user might drag an alternate chest xray from the initially chosen one,
   * and then navigate to another stage or protocol.  If that new stage/protocol
   * uses the name "ChestXRay", then that selection will be used instead of
   * matching the display set selectors.  That allows remembering the
   * user selected views by name.
   */
  reuseIdMap?: Record<string, string>;

  /** Used to define the display sets already in view, in order to allow
   * filling empty viewports with other instances.
   * Only used when the -1 value for displaySetIndex is provided.
   * List of display set instance UID's already displayed.
   */
  inDisplay?: string[];

  /** Select the given stage, either by ID or position.
   * Don't forget that name is used as the ID if ID not provided.
   */
  stageId?: string;
  stageIndex?: number;

  /** Indicates to setup the protocol and fire the PROTOCOL_RESTORED event
   * but don't fire the protocol changed event.  Used to restore the
   * HP service to a previous state.
   */
  restoreProtocol?: boolean;
};

export type HangingProtocolMatchDetails = {
  displaySetMatchDetails: Map<string, DisplaySetMatchDetails>;
  viewportMatchDetails: Map<number, ViewportMatchDetails>;
};

export type ConstraintValue =
  | string
  | number
  | boolean
  | []
  | {
    value: string | number | boolean | [];
  };

export type Constraint = {
  // This value exactly
  equals?: ConstraintValue;
  notEquals?: ConstraintValue;
  // A caseless contains
  containsI?: string;
  contains?: ConstraintValue;
  greaterThan?: ConstraintValue;
};

export type MatchingRule = {
  // No real use for the id
  id?: string;
  // Defaults to 1
  weight?: number;
  attribute: string;
  constraint: Constraint;
  // Not required by default
  required?: boolean;
};

export type ViewportLayoutOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ViewportStructure = {
  layoutType: string;
  properties: {
    rows: number;
    columns: number;
    layoutOptions: ViewportLayoutOptions[];
  };
};

/**
 * Selects the display sets to apply for a given id.
 * This is a set of rules which match the study and display sets
 * and then provides an id for them so that they can re-used in different
 * viewports.
 * The matches are done lazily, so if a stage doesn't need a given match,
 * it won't be selected.
 */
export type DisplaySetSelector = {
  id?: string;
  // The image matching rule (not currently implemented) selects which image to
  // display initially, only for stack views.
  imageMatchingRules?: MatchingRule[];
  // The matching rules to choose the display sets at the series level
  seriesMatchingRules: MatchingRule[];
  studyMatchingRules?: MatchingRule[];
};

export type SyncGroup = {
  type: string;
  id: string;
  source?: boolean;
  target?: boolean;
};

export type initialImageOptions = {
  index?: number;
  preset?: string; // todo: type more
};

export type ViewportOptions = {
  toolGroupId: string;
  viewportType: string;
  id?: string;
  orientation?: string;
  viewportId?: string;
  initialImageOptions?: initialImageOptions;
  syncGroups?: SyncGroup[];
  customViewportProps?: Record<string, unknown>;
};

export type DisplaySetOptions = {
  // The id is used to choose which display set selector to apply here
  id: string;
  /** The offset to allow display secondary series, for example
   * to display the second matching series, use `displaySetIndex==1` */
  displaySetIndex?: number;

  /**  A key to select a display set UID to reuse from the existing sets.
   * If the protocol is run/set with a set of reuseId options in it, then
   * rather than matching the display set rules, the value will be chosen
   * from the map of reuseIds.
   * For example, suppose the reuseId for a mammo study is "LCC", and the
   * study has three different LCC display sets, then the user can navigate
   * the display set to an alternate LCC and preserve that choice in other
   * stages by re-using the reuseId of `LCC`.  Otherwise, the user needs to
   * manually re-select the alternate item.
   */
  reuseId?: string;

  /** A key to indicate that the display set specified by the reuseId must
   * be validated according to the display set rules.
   * For example, suppose the user is viewing a non-volume display set,
   * and they click on the MPR button, then the MPR hanging protocol will require
   * validation and will choose not to display because it can't.
   */
  validateReuseId?: boolean;

  // The options to apply to the display set.
  options?: Record<string, unknown>;
};

export type Viewport = {
  viewportOptions: ViewportOptions;
  displaySets: DisplaySetOptions[];
  displaySetsByPosition?: Record<string, DisplaySetOptions[]>;
};

/**
 * disabled stages are missing display sets required in order to view them.
 * enabled stages have all the requiredDisplaySets and at least preferredViewports
 * filled.
 * passive stages have the requiredDisplaySets and at least requiredViewports filled.
 */
export type StageStatus = 'disabled' | 'enabled' | 'passive';

/**
 * Protocol stages are a set of different views which can be applied, for
 * example, a 2x1 and a 1x1 view might be both applied (see default extension
 * for this example).
 */
export type ProtocolStage = {
  /** The id defaults to the name of the protocol if not otherwise specified */
  id?: string;
  /**
   * The display name used for this stage when shown to the user.  This can
   * differ from the id, for example, to use the same name for different
   * stages, only one of which ends up being active.
   */
  name: string;
  viewportStructure: ViewportStructure;
  viewports: Viewport[];
  /** Indicate if the stage can be applied or not */
  status?: StageStatus;

  /** The number of viewports that must have matching display sets to
   * display differentiate between 'disabled' and other states.
   * For example, if requiredViewports is 2, but only 1 viewport has
   * a display set, then the stage will be marked status `disabled`
   */
  requiredViewports?: number;

  /** The number of viewports required to be matched to differentiate between
   * 'enable' and 'passive' states.
   * For example, if the preferred viewports is 3, then if there are 2 or
   * fewer viewports, the status will be marked as `passive`.
   * If there are 3 or 4 viewports filled, then the status will be 'enabled'
   */
  preferredViewports?: number;

  /**
   * A list of display set selectors which have at least 1 match in order
   * to permit this stage to not be disabled.  For example, if there
   * is a display set selector that matches `PatientSex=M` in this list, then
   * the stage would only apply to males, and would be marked 'disabled'
   * for females or other.
   */
  requiredDisplaySets?: string[];

  /** A viewport definition used for to fill in manually selected viewports.
   * This allows changing the layout definition for additional viewports without
   * needing to define layouts for each of the 1x1, 2x2 etc modes.
   */
  defaultViewport?: Viewport;

  // Unused.
  createdDate?: string;
};

/**
 * A protocol is the top level definition for a hanging protocol.
 * It is a set of rules about when the protocol can be applied at all,
 * as well as a set of stages that represent indivividual views.
 * Additionally, the display set selectors are used to choose from the existing
 * display sets.  The hanging protcol definition here does NOT allow
 * redefining the display sets to use, but only selects the views to show.
 */
export type Protocol = {
  // Mandatory
  id: string;
  /** Maps ids to display set selectors to choose display sets */
  displaySetSelectors: Record<string, DisplaySetSelector>;
  /** A default viewport to use for any stage to select new viewport layouts. */
  defaultViewport?: Viewport;
  stages: ProtocolStage[];
  // Optional
  locked?: boolean;
  hasUpdatedPriorsInformation?: boolean;
  name?: string;
  createdDate?: string;
  modifiedDate?: string;
  availableTo?: Record<string, unknown>;
  editableBy?: Record<string, unknown>;
  toolGroupIds?: string[];
  imageLoadStrategy?: string; // Todo: this should be types specifically
  protocolMatchingRules?: MatchingRule[];
  /* The number of priors required for this hanging protocol.
   * -1 means that NO priors are referenced, and thus this HP matches
   * only the active study, whereas 0 means that an unknown number of
   * priors is matched.
   */
  numberOfPriorsReferenced?: number;
  syncDataForViewports?: boolean;
};

/** Used to dynamically generate protocols.
 * Try to avoid this as it is difficult to provide active/disabled settings
 * to the GUI when this is used, and it can be expensive to apply.
 * Alternatives include using the custom attributes where possible.
 */
export type ProtocolGenerator = ({
  servicesManager: any,
  commandsManager: any,
}) => {
  protocol: Protocol;
};

export type HPInfo = {
  protocolId: string;
  stageId: string;
  stageIndex: number;
  activeStudyUID: string;
};
