import { Command, Option } from "@commander-js/extra-typings";
import {
  cliOutputConfig,
  titleMessage,
  loadConfigToml,
  warnMessage,
} from "@/lib/cli.js";
import { checkCommand } from "@/lib/shell";
import {
  createFolders,
  loadFileNamesToMap,
  moveFiles,
  updateGitignore,
} from "@/lib/utils";
import {
  cloneAccountsFromConfig,
  cloneProgramsFromConfig,
  cloneTokensFromConfig,
  mergeOwnersMapWithConfig,
  validateExpectedCloneCounts,
} from "@/lib/shell/clone";
import { COMMON_OPTIONS } from "@/const/commands";
import {
  DEFAULT_ACCOUNTS_DIR_TEMP,
  DEFAULT_CACHE_DIR,
  DEFAULT_TEST_LEDGER_DIR,
} from "@/const/solana";
import { rmSync } from "fs";
import { deconflictAnchorTomlWithConfig, loadAnchorToml } from "@/lib/anchor";
import { isGitRepo } from "@/lib/git";
import { promptToInitGitRepo } from "@/lib/prompts/git";

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

      let targetGitDir = process.cwd();
      if (!isGitRepo(targetGitDir)) {
        warnMessage(
          `Cloning accounts/programs without tracking changes via git is not recommended`,
        );

        await promptToInitGitRepo(targetGitDir);
      }

      let config = loadConfigToml(
        options.config,
        options,
        true /* config required */,
      );

      // attempt to load and combine the anchor toml clone settings
      const anchorToml = loadAnchorToml(config.configPath);
      if (anchorToml) {
        config = deconflictAnchorTomlWithConfig(anchorToml, config);
      }

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

      let detectedPrograms: ReturnType<typeof mergeOwnersMapWithConfig> = {};
      if (accounts) {
        detectedPrograms = mergeOwnersMapWithConfig(accounts.owners);
        await cloneProgramsFromConfig(
          { settings: config.settings, clone: { program: detectedPrograms } },
          { ...options, autoClone: true },
          currentAccounts,
        );
      }

      // always clone the config-declared programs last (in order to override the detected ones)
      await cloneProgramsFromConfig(config, options, currentAccounts);

      // now that all the files have been deconflicted, we can move them to their final home
      createFolders(DEFAULT_ACCOUNTS_DIR_TEMP);
      moveFiles(DEFAULT_ACCOUNTS_DIR_TEMP, config.settings.accountDir, true);

      rmSync(DEFAULT_ACCOUNTS_DIR_TEMP, {
        recursive: true,
        force: true,
      });

      const cloneCounts = validateExpectedCloneCounts(
        config.settings.accountDir,
        config,
      );
      if (cloneCounts.actual === cloneCounts.expected) {
        console.log(
          `Completed cloning ${cloneCounts.actual} ${
            cloneCounts.actual == 1 ? "account" : "accounts"
          }`,
        );

        // todo: perform a final sanity check to ensure the correct quantity of accounts were cloned
        // if (expectedCount === "")
        // todo: count how many json files exist in the `config.settings.accountDir`
      } else {
        warnMessage(
          `Completed cloning accounts. Expected ${cloneCounts.expected} accounts, but only ${cloneCounts.actual} found`,
        );
      }
    });
}
