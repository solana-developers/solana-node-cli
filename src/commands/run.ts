import { Command, Option } from "@commander-js/extra-typings";
import {
  cliOutputConfig,
  successOutro,
  warnMessage,
  cancelMessage,
  titleMessage,
} from "@/lib/cli.js";
import { checkCommand } from "@/lib/shell";
import {
  doesFileExist,
  loadFileNamesToMap,
  loadTomlFile,
  moveFiles,
} from "@/lib/utils";
import path from "path";
import type { CloneSettings, SolanaToml } from "@/types/config";
import {
  cloneProgramsFromConfig,
  cloneTokensFromConfig,
} from "@/lib/shell/clone";
import { COMMON_OPTIONS } from "@/const/commands";

/**
 * Command: `run`
 *
 * Run various helper tools on your local machine
 */
export default function runCommand() {
  return new Command("run")
    .configureOutput(cliOutputConfig)
    .description("run various helper tools on your local machine")
    .addCommand(runCloneCommand());
}

/**
 * Command: `run clone`
 *
 * Clone all the accounts and programs listed in the Solana.toml file
 */
export function runCloneCommand() {
  return new Command("clone")
    .configureOutput(cliOutputConfig)
    .description(
      "clone all the accounts and programs listed in the Solana.toml file",
    )
    .addOption(
      new Option("--force", "force clone all accounts, even if they exist"),
    )
    .addOption(
      new Option("--prompt", "prompt to override any existing cloned accounts"),
    )
    .addOption(COMMON_OPTIONS.config)
    .addOption(COMMON_OPTIONS.url)
    .action(async (options) => {
      titleMessage("Clone accounts and programs");
      // console.log("Clone accounts and programs", "\n");

      const hasCommand = await checkCommand("solana account --help");
      if (!hasCommand) {
        return console.error(
          "Unable to detect the 'solana account' command. Do you have it installed?",
        );
      }

      // todo: accept both `Solana.toml` and `solana.toml` (case insensitive)
      options.config = path.resolve(options.config);
      if (!doesFileExist(options.config, false)) {
        return console.error("Unable to locate config file:", options.config);
      }

      const config = loadTomlFile<SolanaToml>(options.config);

      // todo: this should be loaded from the config file or the cli args
      const saveDirFinal = "temp/accounts";
      const saveDirTemp = ".cache/temp/accounts";

      const currentAccounts = loadFileNamesToMap(saveDirFinal);

      const cloneSettings: CloneSettings = {
        ...options,
        saveDirFinal,
        saveDirTemp,
      };

      await cloneProgramsFromConfig(config, cloneSettings, currentAccounts);

      await cloneTokensFromConfig(config, cloneSettings, currentAccounts);

      // now that all the files have been deconflicted, we can move them to their final home
      moveFiles(saveDirTemp, saveDirFinal, true);

      // todo: should we remove the entire temp cache dir? no matter what?

      // perform a final sanity check to ensure the correct quantity of accounts were cloned
      const expectedCount: number =
        Object.keys(config.clone.token).length +
        Object.keys(config.clone.program).length;

      const newAccounts = loadFileNamesToMap(saveDirFinal);

      if (expectedCount === newAccounts.size) {
        console.log(
          `Completed cloning ${expectedCount} ${
            expectedCount == 1 ? "account" : "accounts"
          }`,
        );

        // todo: perform a final sanity check to ensure the correct quantity of accounts were cloned
        // if (expectedCount === "")
        // todo: count how many json files exist in the saveDirFinal
      } else {
        console.warn(
          `Completed cloning accounts.`,
          `Expected ${expectedCount} accounts,`,
          `but ${newAccounts.size} found`,
        );
      }
    });
}
