import { Command, Option } from "@commander-js/extra-typings";
import { cliOutputConfig, titleMessage, loadConfigToml } from "@/lib/cli.js";
import { checkCommand } from "@/lib/shell";
import { loadFileNamesToMap, moveFiles } from "@/lib/utils";
import {
  cloneProgramsFromConfig,
  cloneTokensFromConfig,
} from "@/lib/shell/clone";
import { COMMON_OPTIONS } from "@/const/commands";
import { DEFAULT_ACCOUNTS_DIR_TEMP } from "@/const/solana";

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
    .addOption(COMMON_OPTIONS.accountDir)
    .addOption(COMMON_OPTIONS.config)
    .addOption(COMMON_OPTIONS.url)
    .action(async (options) => {
      titleMessage("Clone accounts and programs");
      // console.log("Clone accounts and programs", "\n");

      // console.log("options:");
      // console.log(options);

      await checkCommand("solana account --help", {
        exit: true,
        message:
          "Unable to detect the 'solana account' command. Do you have it installed?",
      });

      const config = loadConfigToml(options.config, options);

      const currentAccounts = loadFileNamesToMap(config.settings.accountDir);

      await cloneProgramsFromConfig(config, options, currentAccounts);

      await cloneTokensFromConfig(config, options, currentAccounts);

      // now that all the files have been deconflicted, we can move them to their final home
      moveFiles(DEFAULT_ACCOUNTS_DIR_TEMP, config.settings.accountDir, true);

      // todo: should we remove the entire temp cache dir? no matter what?

      // perform a final sanity check to ensure the correct quantity of accounts were cloned
      const expectedCount: number =
        Object.keys(config.clone.token).length +
        Object.keys(config.clone.program).length;

      const newAccounts = loadFileNamesToMap(config.settings.accountDir);

      if (expectedCount === newAccounts.size) {
        console.log(
          `Completed cloning ${expectedCount} ${
            expectedCount == 1 ? "account" : "accounts"
          }`,
        );

        // todo: perform a final sanity check to ensure the correct quantity of accounts were cloned
        // if (expectedCount === "")
        // todo: count how many json files exist in the `config.settings.accountDir`
      } else {
        console.warn(
          `Completed cloning accounts.`,
          `Expected ${expectedCount} accounts,`,
          `but ${newAccounts.size} found`,
        );
      }
    });
}
