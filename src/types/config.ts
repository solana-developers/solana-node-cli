export type SolanaToml = {
  settings?: Partial<{
    /**
     * default cluster to use for all operations.
     * when not set, fallback to the Solana CLI cluster
     */
    cluster: SolanaCluster;
    /** local directory path to store any cloned accounts */
    accountDir: string;
    /** path to the local authority keypair */
    keypair: string;
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

type SolanaTomlCloneConfig = {
  address: string;
  name?: string;
  cluster?: SolanaCluster;
  clone?: "always" | "prompt";
};

type SolanaTomlClone = {
  program: {
    [key: string]: SolanaTomlCloneConfig;
  };
  account: {
    [key: string]: SolanaTomlCloneConfig;
  };
  token: {
    [key: string]: SolanaTomlCloneConfig & {
      amount?: number;
      mintAuthority?: string;
      freezeAuthority?: string;
      holders?: Array<{
        owner: string;
        amount?: number;
      }>;
    };
  };
};

export type CloneSettings = {
  force?: boolean;
  prompt?: boolean;
};
