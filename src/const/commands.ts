import { Option } from "@commander-js/extra-typings";
import {
  DEFAULT_ACCOUNTS_DIR,
  DEFAULT_CONFIG_FILE,
  DEFAULT_KEYPAIR_PATH,
} from "./solana";

/**
 * Listing of the common and reusable command options
 */
export const COMMON_OPTIONS = {
  /**
   * path to the local Solana.toml config file
   *
   * note: this is a different config file than the solana cli's config file
   */
  config: new Option(
    "-c --config <path>",
    "path to a Solana.toml config file",
  ).default(DEFAULT_CONFIG_FILE),
  /**
   * path to the local authority keypair
   */
  keypair: new Option("--keypair <path>", "path to a keypair file").default(
    DEFAULT_KEYPAIR_PATH,
  ),
  /**
   * rpc url or moniker to use
   */
  url: new Option(
    "-u --url <URL_OR_MONIKER>",
    "URL for Solana's JSON RPC or moniker",
  ).default("mainnet"),
  /**
   * local directory path to store and load any cloned accounts
   */
  accountDir: new Option(
    "--account-dir <ACCOUNT_DIR>",
    "local directory path to store any cloned accounts",
  ).default(DEFAULT_ACCOUNTS_DIR),
};
