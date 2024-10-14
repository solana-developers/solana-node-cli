import { Option } from "@commander-js/extra-typings";

/**
 * Listing of the common and reusable command options
 */
export const COMMON_OPTIONS = {
  config: new Option(
    "-c --config <path>",
    "path to a Solana.toml config file",
  ).default("temp/Solana.toml"),
  // .default("Solana.toml"), // todo: use this
  url: new Option(
    "-u --url <URL_OR_MONIKER>",
    "URL for Solana's JSON RPC or moniker",
  ),
};
