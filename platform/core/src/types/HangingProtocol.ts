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
   * For example, a Chest XRay might use reuseId "ChestXRay", so that the
   * given display set can be repositioned by name, even if an alternate
   * ChestXRay was chosen.
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
   * from the map of reuseIds.  This allows preserving items either by
   * position or other keys such as the type of instance.
   */
  reuseId?: string;
  /** A key to indicate that the display set specified by the reuseId must
   * be validated according to the display set rules.  This can be used to
   * enforce required viewport conditions such as isVolume, for hanging
   * protocols which are typically applied to an existing set of matches such
   * as the MPR viewport.
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
 * enabled stages have all the requiredDs and at least preferredViewports
 * filled.
 * passive stages have the requiredDs and at least requiredViewports filled.
 */
export type StageEnabled = 'disabled' | 'enabled' | 'passive';

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
  enable?: StageEnabled;
  /** The number of viewports that must have matching display sets to
   * display differentiate between 'disabled' and other states. */
  requiredViewports?: number;
  /** The number of viewports required to be matched to differentiate between
   * 'enable' and 'passive' states.
   */
  preferredViewports?: number;
  /** A display set selector can be chosen that is required to view this
   * stage.  This can be used to disable display sets when they are mising,
   * for example, to apply views only to Males or only Females by choose
   * a display set selector that selects based on sex.
   */
  requiredDs?: string[];
  /** A viewport definition used for changing the layout manually.  Used as the
   * basic definition for new viewports.
   */
  defaultViewport?: Viewport;
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
