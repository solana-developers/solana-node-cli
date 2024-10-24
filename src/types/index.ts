export type PlatformOS = "unknown" | "linux" | "mac" | "windows";

export type ToolNames =
  | "rust"
  | "solana"
  | "avm"
  | "anchor"
  | "yarn"
  | "trident";

export type ToolCommandConfig = {
  /** $PATH location for the command's tools */
  pathSource?: string;
  /** command to get the tool version */
  version: string;
  /** command to install the tool */
  // install: string;
  /** command to update the tool */
  // update: string;
};

/**
 *
 */
export type InstallCommandPropsBase = {
  /**  */
  os?: PlatformOS;
  /**  */
  version?: string;
  /**  */
  verbose?: boolean;
  /**  */
  verifyParentCommand?: boolean;

  /**
   * Reference to an existing `spinner`
   */
  // spinner: ReturnType<typeof spinner>;
};
