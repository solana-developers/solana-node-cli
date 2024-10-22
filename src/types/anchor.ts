import { SolanaTomlCloneConfig } from "./config";

export type AnchorToml = {
  configPath?: string;
  programs?: {
    localnet?: Record<string, string>;
    devnet?: Record<string, string>;
    testnet?: Record<string, string>;
    mainnet?: Record<string, string>;
  };
  test?: {
    validator?: {
      /** rpc url to use in order to clone */
      url?: string;
      /** program to clone */
      clone?: SolanaTomlCloneConfig[];
      /** accounts to clone */
      // note: `account` also supports `filename` but we do nothing with that here
      account?: SolanaTomlCloneConfig[];
    };
  };
};

export type AnchorTomlWithConfigPath = Omit<AnchorToml, "configPath"> &
  NonNullable<{ configPath: AnchorToml["configPath"] }>;
