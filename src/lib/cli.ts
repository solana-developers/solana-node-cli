/**
 * Assorted helper functions and wrappers for working in the CLI
 */

import { OutputConfiguration } from "@commander-js/extra-typings";
import picocolors from "picocolors";
import {
  directoryExists,
  doesFileExist,
  findFileInRepo,
  isInCurrentDir,
  loadTomlFile,
} from "./utils";
import { SolanaToml, SolanaTomlWithConfigPath } from "@/types/config";
import { DEFAULT_CONFIG_FILE } from "@/const/solana";
import { join } from "path";
import { COMMON_OPTIONS } from "@/const/commands";

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

/**
 * Print a plain message using clack's `outro`
 * (including a process exit code)
 */
export function titleMessage(msg: string) {
  console.log(picocolors.inverse(` ${msg} `));
}

/**
 * Display a yellow warning message without exiting the cli
 */
export function warnMessage(msg: string, highlight: boolean = false) {
  console.log(picocolors.yellow(msg));
}

/**
 * Show a cancel outro and exit the cli process
 */
export function cancelMessage(msg: string = "Operation canceled") {
  console.log(msg);
  // cancel(msg);
  process.exit();
}

/**
 * Show a cancel outro and exit the cli process
 */
export function warningOutro(msg: string = "Operation canceled") {
  warnMessage(msg);
  process.exit();
}

/**
 * Print a plain message using clack's `outro`
 * (including a process exit code)
 */
export function cancelOutro(msg: string = "Operation canceled") {
  console.log(picocolors.inverse(` ${msg} `), "\n");
  // outro(picocolors.inverse(` ${msg} `));
  process.exit(0);
}

/**
 * Print a blue notice message using clack's `outro`
 * (including a process exit code)
 */
export function noticeOutro(msg: string) {
  // outro(picocolors.bgBlue(` ${msg} `));
  console.log(picocolors.bgBlue(` ${msg} `), "\n");
  process.exit(0);
}

/**
 * Print a green success message using clack's `outro`
 * (including a process exit code)
 */
export function successOutro(msg: string = "Operation successful") {
  console.log(picocolors.bgGreen(` ${msg} `), "\n");
  // outro(picocolors.bgGreen(` ${msg} `));
  process.exit(0);
}

/**
 * Print a red error message using clack's `outro`
 * (including a process exit code)
 */
export function errorOutro(msg: string, title: string | null = null) {
  if (title) {
    console.log(picocolors.bgRed(` ${title} `));
    console.log(msg, "\n");
  } else console.log(picocolors.bgRed(` ${msg} `), "\n");
  process.exit(1);
}

/**
 * Display a error message with using clack
 * (including a process exit code)
 */
export function errorMessage(err: any, title: string = "An error occurred") {
  let message = "Unknown error";

  if (typeof err == "string") {
    message = err;
  } else if (err instanceof Error) {
    message = err.message;
  }

  errorOutro(message, title);
}
