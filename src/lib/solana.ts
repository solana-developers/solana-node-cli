import { Keypair } from "@solana/web3.js";
import { doesFileExist, loadJsonFile } from "./utils";
import { errorOutro } from "./cli";

export function loadKeypairFromFile(
  filePath: string = "~/.config/solana/id.json",
) {
  if (!doesFileExist(filePath)) {
    errorOutro(`${filePath}`, "Unable to locate keypair file");
  }
  const jsonBytes = loadJsonFile<Uint8Array>(filePath);
  return Keypair.fromSecretKey(Buffer.from(jsonBytes));
}
