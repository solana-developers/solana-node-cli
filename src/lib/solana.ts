import { Keypair } from "@solana/web3.js";
import { doesFileExist, loadJsonFile } from "./utils";
import { DEFAULT_KEYPAIR_PATH } from "@/const/solana";

export function loadKeypairFromFile(
  filePath: string = DEFAULT_KEYPAIR_PATH,
): Keypair | null {
  if (!doesFileExist(filePath)) return null;
  const jsonBytes = loadJsonFile<Uint8Array>(filePath);
  return Keypair.fromSecretKey(Buffer.from(jsonBytes));
}
