import { Command, Option } from "@commander-js/extra-typings";
import {
  cliOutputConfig,
  successOutro,
  warnMessage,
  cancelMessage,
  titleMessage,
} from "@/lib/cli.js";
import { checkCommand } from "@/lib/shell";
import { doesFileExist, loadFileNamesToMap } from "@/lib/utils";
import {
  buildTestValidatorCommand,
  runTestValidator,
} from "@/lib/shell/test-validator";
import { COMMON_OPTIONS } from "@/const/commands";
import { loadKeypairFromFile } from "@/lib/solana";

/**
 * Command: `test-validator`
 *
 * Run the 'solana-test-validator' on your local machine
 */
export default function testValidatorCommand() {
  return (
    new Command("test-validator")
      .configureOutput(cliOutputConfig)
      .description("run the 'solana-test-validator' on your local machine")
      // .addOption(
      //   new Option("--prompt", "prompt to override any existing cloned accounts"),
      // )
      .addOption(
        new Option(
          "--output",
          "only output the generated test-validator command",
        ),
      )
      .addOption(
        new Option(
          "--reset",
          "reset the test-validator to genesis, reloading all preloaded accounts",
        ),
      )
      .addOption(
        new Option(
          "--account-dir <ACCOUNT_DIR>",
          "load all the accounts located in this directory",
        ).default("temp/accounts"),
        // .default("accounts"), // todo: use this default
      )
      .addOption(COMMON_OPTIONS.config)
      .addOption(COMMON_OPTIONS.authority)
      .addOption(COMMON_OPTIONS.url)
      .action(async (options) => {
        titleMessage("solana-test-validator");

        // console.log("options:");
        // console.log(options);

        const hasCommand = await checkCommand(
          "solana-test-validator --version",
        );

        if (!hasCommand) {
          return console.error(
            "Unable to detect the 'solana-test-validator'. Do you have it installed?",
          );
        }

        // todo: build the options from combining the cli args and the config file

        let authorityAddress: string | null = null;

        if (options.keypair) {
          if (doesFileExist(options.keypair)) {
            authorityAddress = loadKeypairFromFile(
              options.keypair,
            )?.publicKey.toBase58();
          } else {
            console.warn("Unable to locate keypair file:", options.keypair);
          }
        }

        const command = buildTestValidatorCommand({
          verbose: !options.output,
          reset: options.reset || false,
          accountDir: options.accountDir,
          // todo: allow setting the authority from the cli args
          authority: authorityAddress,
        });

        // only log the "run validator" command, do not execute it
        if (options.output) {
          console.log(`\n${command}`);
          return;
        }

        if (options.reset) {
          console.log(
            "Loaded",
            loadFileNamesToMap(options.accountDir, ".json").size,
            "accounts into the local validator",
          );
          console.log(
            "Loaded",
            loadFileNamesToMap(options.accountDir, ".so").size,
            "programs into the local validator",
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

        runTestValidator({
          command,
        });
      })
  );
}
