/**
 * Assorted helper functions and wrappers for working in the CLI
 */

import { join } from "path";
import { OutputConfiguration } from "@commander-js/extra-typings";
import {
  directoryExists,
  doesFileExist,
  findFileInRepo,
  isInCurrentDir,
  loadTomlFile,
} from "@/lib/utils";
import { SolanaToml, SolanaTomlWithConfigPath } from "@/types/config";
import { DEFAULT_CONFIG_FILE } from "@/const/solana";
import { COMMON_OPTIONS } from "@/const/commands";
import { warningOutro, warnMessage } from "@/lib/logs";

/**
 * Load the Solana.toml config file and handle the default settings overrides
 */
export function loadConfigToml(
  configPath: string = DEFAULT_CONFIG_FILE,
  settings: object = {},
  isConfigRequired: boolean = false,
): SolanaTomlWithConfigPath {
  // allow the config path to be a directory, with a Solana.toml in it
  if (directoryExists(configPath)) {
    configPath = join(configPath, DEFAULT_CONFIG_FILE);
  }

  // attempt to locate the closest config file
  if (configPath === DEFAULT_CONFIG_FILE) {
    // accept both `Solana.toml` and `solana.toml` (case insensitive)
    const newPath = findFileInRepo(DEFAULT_CONFIG_FILE);
    if (newPath) {
      configPath = newPath;
      if (!isInCurrentDir(newPath)) {
        // todo: should we prompt the user if they want to use this one?
        warnMessage(`Using closest Solana.toml located at: ${newPath}`);
      }
    }
  }

  let config: SolanaToml = { configPath };

  if (doesFileExist(configPath, true)) {
    config = loadTomlFile<SolanaToml>(configPath) || config;
  } else {
    if (isConfigRequired) {
      warningOutro(`No Solana.toml config file found. Operation canceled.`);
    } else warnMessage(`No Solana.toml config file found. Skipping.`);
  }

  const defaultSettings: SolanaToml["settings"] = {
    cluster: COMMON_OPTIONS.url.defaultValue,
    accountDir: COMMON_OPTIONS.accountDir.defaultValue,
    keypair: COMMON_OPTIONS.keypair.defaultValue,
  };

  config.settings = Object.assign(defaultSettings, config.settings || {});

  config = deconflictConfig(config, settings);

  config.configPath = configPath;
  return config as SolanaTomlWithConfigPath;
}

export function deconflictConfig(config: SolanaToml, args: any) {
  if (args?.url && args.url !== COMMON_OPTIONS.url.defaultValue) {
    config.settings.cluster = args.url;
  }
  if (
    args?.accountDir &&
    args.accountDir !== COMMON_OPTIONS.accountDir.defaultValue
  ) {
    config.settings.accountDir = args.accountDir;
  }

  if (args?.keypair && args.keypair !== COMMON_OPTIONS.keypair.defaultValue) {
    config.settings.keypair = args.keypair;
  }

  return config;
}

/**
 * Default Commander output configuration to be passed into `configureOutput()`
 */
export const cliOutputConfig: OutputConfiguration = {
  writeErr(str: string) {
    // log.error(str.trim() + "\n");
    console.log(str.trim() + "\n");
    // console.log();
  },
  writeOut(str: string) {
    // log.info(str.trim() + "\n");
    console.log(str.trim() + "\n");
    // console.log();
  },
};
