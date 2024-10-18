import { Command, Option } from "@commander-js/extra-typings";
import {
  cliOutputConfig,
  titleMessage,
  loadConfigToml,
  warnMessage,
} from "@/lib/cli.js";
import { checkCommand } from "@/lib/shell";
import { loadFileNamesToMap, moveFiles, updateGitignore } from "@/lib/utils";
import {
  cloneAccountsFromConfig,
  cloneProgramsFromConfig,
  cloneTokensFromConfig,
  mergeOwnersMapWithConfig,
} from "@/lib/shell/clone";
import { COMMON_OPTIONS } from "@/const/commands";
import {
  DEFAULT_ACCOUNTS_DIR_TEMP,
  DEFAULT_CACHE_DIR,
  DEFAULT_TEST_LEDGER_DIR,
} from "@/const/solana";
import { rmSync } from "fs";

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
      new Option(
        "--no-prompt",
        "skip the prompts to override any existing cloned accounts",
      ),
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

      const config = loadConfigToml(
        options.config,
        options,
        true /* config required */,
      );
      // options = Object.assign({}, config.settings, options);

      updateGitignore([DEFAULT_CACHE_DIR, DEFAULT_TEST_LEDGER_DIR]);

      rmSync(DEFAULT_ACCOUNTS_DIR_TEMP, {
        recursive: true,
        force: true,
      });

      const currentAccounts = loadFileNamesToMap(config.settings.accountDir);

      /**
       * we clone the accounts in the order of: accounts, tokens, then programs
       * in order to perform any special processing on them
       */

      const accounts = await cloneAccountsFromConfig(
        config,
        options,
        currentAccounts,
      );
      await cloneTokensFromConfig(config, options, currentAccounts);

      const detectedPrograms = mergeOwnersMapWithConfig(accounts.owners);
      await cloneProgramsFromConfig(
        { settings: config.settings, clone: { program: detectedPrograms } },
        { ...options, autoClone: true },
        currentAccounts,
      );

      // always clone the config-declared programs last (in order to override the detected ones)
      await cloneProgramsFromConfig(config, options, currentAccounts);

      // now that all the files have been deconflicted, we can move them to their final home
      moveFiles(DEFAULT_ACCOUNTS_DIR_TEMP, config.settings.accountDir, true);

      // todo: should we remove the entire temp cache dir? no matter what?
      rmSync(DEFAULT_ACCOUNTS_DIR_TEMP, {
        recursive: true,
        force: true,
      });

      // perform a final sanity check to ensure the correct quantity of accounts were cloned
      let expectedCount: number = 0;

      if (config?.clone?.account)
        expectedCount += Object.keys(config.clone.account).length;
      if (config?.clone?.token)
        expectedCount += Object.keys(config.clone.token).length;
      if (config?.clone?.program)
        expectedCount += Object.keys(config.clone.program).length;
      if (Object.keys(detectedPrograms).length) {
        warnMessage(
          `Auto detected and cloned ${
            Object.keys(detectedPrograms).length
          } programs`,
        );
        expectedCount += Object.keys(detectedPrograms).length;
      }

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
        warnMessage(
          `Completed cloning accounts. Expected ${expectedCount} accounts, but ${newAccounts.size} found`,
        );
      }
    });
}
