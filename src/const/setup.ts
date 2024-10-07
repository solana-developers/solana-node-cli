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
};
