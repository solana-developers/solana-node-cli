import { Keypair } from "@solana/web3.js";
import { doesFileExist, loadJsonFile } from "./utils";
import { DEFAULT_KEYPAIR_PATH } from "@/const/solana";
import { ProgramBuildLabels, SolanaCluster } from "@/types/config";
import { warnMessage } from "./cli";

export function loadKeypairFromFile(
  filePath: string = DEFAULT_KEYPAIR_PATH,
): Keypair | null {
  if (!doesFileExist(filePath)) return null;
  const jsonBytes = loadJsonFile<Uint8Array>(filePath);
  return Keypair.fromSecretKey(Buffer.from(jsonBytes));
}

/**
 * Parse the provided url to correct it into a valid moniker or rpc url
 */
export function parseRpcUrlOrMoniker(
  input: string,
  allowUrl: boolean = true,
  includeBetaLabel: boolean = false,
): SolanaCluster | string {
  if (allowUrl && input.match(/^http?s/i)) {
    try {
      return new URL(input).toString();
    } catch (err) {
      console.error("Unable to parse 'url':", input);
      process.exit(1);
    }
    return input;
  } else if (input.startsWith("local") || input.startsWith("l")) {
    return "localhost";
  } else if (input.startsWith("t")) {
    return "testnet";
  } else if (input.startsWith("d")) {
    return "devnet";
  } else if (input.startsWith("m")) {
    return includeBetaLabel ? "mainnet-beta" : "mainnet";
  } else {
    warnMessage("Unable to parse url or moniker. Falling back to mainnet");
    return includeBetaLabel ? "mainnet-beta" : "mainnet";
  }
}

export function safeCheckClusterLabel(
  labels: ProgramBuildLabels,
  cluster: SolanaCluster,
): false | keyof ProgramBuildLabels {
  // allow equivalent cluster names
  switch (cluster) {
    case "localhost":
    case "localnet": {
      cluster = "localnet";
      break;
    }
    case "mainnet":
    case "mainnet-beta": {
      cluster = "mainnet";
      break;
    }
    //  we do not need to handle these since there is not a common equivalent
    // case "devnet":
    // case "testnet":
    // default:
  }

  if (Object.hasOwn(labels, cluster)) return cluster;
  else return false;
}
