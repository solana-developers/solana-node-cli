import { Keypair } from "@solana/web3.js";
import { loadJsonFile } from "./utils";

export function loadKeypairFromFile(
  filePath: string = "~/.config/solana/id.json",
) {
  const jsonBytes = loadJsonFile<Uint8Array>(filePath);
  return Keypair.fromSecretKey(Buffer.from(jsonBytes));
}
