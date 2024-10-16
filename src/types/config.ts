export type SolanaToml = {
  settings?: Partial<{
    /**
     * default cluster to use for all operations.
     * when not set, fallback to the Solana CLI cluster
     */
    cluster: SolanaCluster;
    /**
     * custom rpc urls for each network that will be used to override the default public endpoints
     */
    networks: Partial<{
      mainnet: string;
      devnet: string;
      testnet: string;
      localnet: string;
    }>;
  }>;
  clone?: Partial<SolanaTomlClone>;
};

export type SolanaCluster =
  | "mainnet"
  | "mainnet-beta"
  | "devnet"
  | "testnet"
  | "localhost"
  | "localnet";

type SolanaTomlClone = {
  settings: {
    cluster: SolanaCluster;
    // todo: we could allow people to manually override any cluster url from within the toml file
    // todo: including using loading env vars
  };
  program: {
    [key: string]: {
      address: string;
      name?: string;
      cluster?: SolanaCluster;
      clone?: "always" | "prompt";
    };
  };
  token: {
    [key: string]: {
      address: string;
      cluster?: SolanaCluster;
      clone?: "always" | "prompt";
      name?: string;
      amount?: number;
      mintAuthority?: string;
      freezeAuthority?: string;
      holders?: Array<{
        owner: string;
        amount?: number;
      }>;
    };
  };
  // todo: support generic accounts, and maybe handle anchor idl things
  //   account?: {
  //     [key: string]: {
  //       address: string;
  //       name?: string;
  //     };
  //   };
};

export type CloneSettings = {
  force?: boolean;
  prompt?: boolean;
  saveDirFinal: string;
  saveDirTemp: string;
};
