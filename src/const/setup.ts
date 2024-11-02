import { ToolCommandConfig, ToolNames } from "@/types";

export const TOOL_CONFIG: { [key in ToolNames]: ToolCommandConfig } = {
  rust: {
    pathSource: "$HOME/.cargo/env",
    version: "rustc --version",
  },
  solana: {
    pathSource: "$HOME/.local/share/solana/install/active_release/bin",
    version: "solana --version",
  },
  avm: {
    version: "avm --version",
  },
  anchor: {
    version: "anchor --version",
  },
  yarn: {
    version: "yarn --version",
  },
  trident: {
    // the trident cli does not have a version command, so we grab it from cargo
    version: "cargo install --list | grep trident-cli",
  },
  zest: {
    // the zest cli does not have a version command, so we grab it from cargo
    version: "cargo install --list | grep zest",
  },
  verify: {
    version: "solana-verify --version",
  },
};

export enum PathSourceStatus {
  SUCCESS,
  FAILED,
  OUTPUT_MISMATCH,
  MISSING_PATH,
}
