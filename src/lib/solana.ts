import { Keypair } from "@solana/web3.js";
import { doesFileExist, loadJsonFile } from "./utils";
import { DEFAULT_KEYPAIR_PATH } from "@/const/solana";
import { SolanaCluster } from "@/types/config";
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
export function parseRpcUrlOrMoniker(url: string): SolanaCluster | string {
  if (url.match(/^http?s/i)) {
    try {
      return new URL(url).toString();
    } catch (err) {
      console.error("Unable to parse 'url':", url);
      process.exit(1);
    }
    return url;
  } else if (url.startsWith("local") || url.startsWith("l")) {
    return "localhost";
  } else if (url.startsWith("t")) {
    return "testnet";
  } else if (url.startsWith("d")) {
    return "devnet";
  } else if (url.startsWith("m")) {
    return "mainnet-beta";
  } else {
    warnMessage("Unable to parse url or moniker. Falling back to mainnet");
    return "mainnet-beta";
  }
}
