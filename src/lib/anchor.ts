import { AnchorToml } from "@/types/anchor";
import { directoryExists, doesFileExist, loadTomlFile } from "./utils";
import { join, dirname } from "path";
import { loadConfigToml, warningOutro } from "./cli";

const ANCHOR_TOML = "Anchor.toml";

/**
 * Load an Anchor.toml file, normally from the same dir as the Solana.toml
 */
export function loadAnchorToml(
  configPath: string,
  isConfigRequired: boolean = false,
): AnchorToml {
  // allow the config path to be a full filepath to search that same directory
  if (!configPath.endsWith(ANCHOR_TOML)) configPath = dirname(configPath);

  // allow the config path to be a directory, with an Anchor.toml in it
  if (directoryExists(configPath)) configPath = join(configPath, ANCHOR_TOML);

  let anchor: AnchorToml = {};

  if (doesFileExist(configPath, true)) {
    anchor = loadTomlFile<AnchorToml>(configPath) || anchor;
  } else {
    if (isConfigRequired) {
      warningOutro(`No Anchor.toml config file found. Operation canceled.`);
    }
    // else warnMessage(`No Anchor.toml config file found. Skipping.`);
  }

  return anchor;
}

/**
 * Deconflict and merge Anchor.toml into the Solana.toml config
 *
 * note: intentionally mutates the `config`
 */
export function deconflictAnchorTomlWithConfig(
  anchorToml: AnchorToml,
  config: ReturnType<typeof loadConfigToml>,
) {
  // todo: use the provided `anchorToml.test.validator.url`?

  // copy anchor cloneable programs
  if (anchorToml.test?.validator?.clone) {
    for (const cloner in anchorToml.test.validator.clone) {
      if (
        Object.prototype.hasOwnProperty.call(
          anchorToml.test.validator.clone,
          cloner,
        ) &&
        !config.clone.program[anchorToml.test.validator.clone[cloner].address]
      ) {
        if (anchorToml.test.validator?.url) {
          anchorToml.test.validator.clone[cloner].cluster =
            anchorToml.test.validator.url;
        }

        // looks ugly, but we dont have to allocate anything
        config.clone.program[anchorToml.test.validator.clone[cloner].address] =
          anchorToml.test.validator.clone[cloner];
      }
    }
  }

  // todo: for accounts that are owned by the token programs,
  // todo: attempt to resolve them as mints and clone them using our mint cloner

  // copy anchor cloneable accounts
  if (anchorToml.test?.validator?.account) {
    for (const cloner in anchorToml.test.validator.account) {
      if (
        Object.prototype.hasOwnProperty.call(
          anchorToml.test.validator.account,
          cloner,
        ) &&
        !config.clone.program[anchorToml.test.validator.account[cloner].address]
      ) {
        if (anchorToml.test.validator?.url) {
          anchorToml.test.validator.account[cloner].cluster =
            anchorToml.test.validator.url;
        }

        // looks ugly, but we dont have to allocate anything
        config.clone.program[
          anchorToml.test.validator.account[cloner].address
        ] = anchorToml.test.validator.account[cloner];
      }
    }
  }

  // console.log(config.clone.program);

  return config;
}
