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
import path, { resolve } from "path";
import { MintLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { CloneSettings, SolanaToml } from "@/types/config";
import {
  cloneAccount,
  cloneProgram,
  cloneProgramsFromConfig,
  cloneTokensFromConfig,
  JsonAccountStruct,
} from "@/lib/shell/clone";
import { unlinkSync } from "fs";
import {
  buildTestValidatorCommand,
  runTestValidator,
} from "@/lib/shell/test-validator";
import { loadKeypairFromFile } from "@/lib/solana";
// import { MintLayout } from "@/programs/token";

/**
 * Command: `run`
 *
 * Run the 'solana-test-validator' on your local machine
 */
export default function runCommand() {
  return new Command("run")
    .configureOutput(cliOutputConfig)
    .description("run the 'solana-test-validator' on your local machine")
    .addCommand(runCloneCommand())
    .action(async () => {
      titleMessage("solana-test-validator");

      //   // todo: do we need to detect windows things here?
      //   // const os = detectOperatingSystem();

      const hasCommand = await checkCommand("solana-test-validator --version");

      if (!hasCommand) {
        return console.error(
          "Unable to detect the 'solana-test-validator'. Do you have it installed?",
        );
      }

      const explorerUrl = new URL(
        "https://explorer.solana.com/?cluster=custom",
      );
      // explorerUrl.searchParams.set("customUrl", "http://localhost:8899");
      console.log("\nSolana Explorer for your local test-validator:");
      console.log(
        "(on Brave Browser, you may need to turn Shields down for the Explorer website)",
      );
      console.log(explorerUrl.toString(), "\n");

      const accountDir = "temp/accounts";

      const runCommand = buildTestValidatorCommand({
        reset: true,
        accountDir,
        // todo: allow setting the authority from the cli args
        // authority: loadKeypairFromFile().publicKey.toBase58(),
      });

      console.log(
        "Loaded",
        loadFileNamesToMap(accountDir, ".json").size,
        "accounts into the local validator",
      );
      console.log(
        "Loaded",
        loadFileNamesToMap(accountDir, ".so").size,
        "programs into the local validator",
      );
      // console.log(`Command to run:\n------\n${runCommand}\n------`);

      // return;

      // todo: display some details about the command about to be run?
      // todo: maybe even info about the accounts loaded? and which were modified?

      runTestValidator({
        command: runCommand,
      });

      return;

      //   // const accountJson = loadJsonFile<AccountJsonStruct>(
      //   //   path.resolve(
      //   //     "/home/nick/code/test-validator-shenanigans",
      //   //     "accounts",
      //   //     "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.json",
      //   //   ),
      //   // );
      //   // console.log(accountJson);

      //   // console.log("data:");

      //   // console.log(accountJson.account.data[0]);
      //   // console.log("owner:", accountJson.account.owner);
      //   // const buffer = Buffer.from(accountJson.account.data[0], "base64");
      //   // console.log("buffer");
      //   // console.log(buffer);
      //   // // console.log("length:", buffer.length);

      //   // const mint = MintLayout.decode(buffer);
      //   // // console.log("mint:", mint);
      //   // // console.log(mint);

      //   // const newData = Buffer.alloc(buffer.length);
      //   // console.log("pre encode:");
      //   // console.log(newData);
      //   // MintLayout.encode(mint, newData);
      //   // console.log("post encode:");
      //   // console.log(newData);
    });
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
      "Clone all the accounts and programs listed in the Solana.toml file",
    )
    .addOption(
      new Option("--force", "force clone all accounts, even if they exist"),
    )
    .addOption(
      new Option("--prompt", "prompt to override any existing cloned accounts"),
    )
    .addOption(
      new Option(
        "-c --config <path>",
        "path to a solana.toml config file",
      ).default("temp/solana.toml"),
      // .default("solana.toml"), // todo: use this
    )
    .addOption(
      new Option(
        "-u --url <URL_OR_MONIKER>",
        "URL for Solana's JSON RPC or moniker",
      ),
    )
    .action(async (options) => {
      titleMessage("Clone accounts and programs");
      // console.log("Clone accounts and programs", "\n");

      const hasCommand = await checkCommand("solana account --help");
      if (!hasCommand) {
        return console.error(
          "Unable to detect the 'solana account' command. Do you have it installed?",
        );
      }

      // todo: accept both `solana.toml` and `Solana.toml`
      options.config = path.resolve(options.config);
      if (!doesFileExist(options.config)) {
        return console.error("Unable to locate config file:", options.config);
      }

      const config = loadTomlFile<SolanaToml>(options.config);

      // todo: this should be loaded from the config file or the cli args
      const saveDirFinal = "temp/accounts";
      const saveDirTemp = ".cache/temp/accounts";

      const currentAccounts = loadFileNamesToMap(saveDirFinal);

      const cloneSettings: CloneSettings = {
        ...options,
        url: options.url as any,
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
