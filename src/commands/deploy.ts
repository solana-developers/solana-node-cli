import path from "path";
import { Command, Option } from "@commander-js/extra-typings";
import { COMMON_OPTIONS } from "@/const/commands";
import { cliOutputConfig, loadConfigToml } from "@/lib/cli";
import { titleMessage, warnMessage } from "@/lib/logs";
import { checkCommand, shellExecInSession } from "@/lib/shell";
import { buildDeployProgramCommand } from "@/lib/shell/deploy";
import { autoLocateProgramsInWorkspace } from "@/lib/cargo";
import { directoryExists, doesFileExist } from "@/lib/utils";

/**
 * Command: `deploy`
 *
 * Manage Solana program deployments and upgrades
 */
export function deployCommand() {
  return new Command("deploy")
    .configureOutput(cliOutputConfig)
    .description("deploy a Solana program")
    .usage("[options] [-- <DEPLOY_ARGS>...]")
    .addOption(
      new Option(
        "-- <DEPLOY_ARGS>",
        `arguments to pass to the underlying 'solana program' command`,
      ),
    )
    .addOption(
      new Option(
        "-p --program-name <PROGRAM_NAME>",
        "name of the program to deploy",
      ),
    )
    .addOption(
      new Option("--manifest-path <PATH>", "path to Cargo.toml").default(
        path.join(process.cwd(), "Cargo.toml"),
      ),
    )
    .addOption(COMMON_OPTIONS.url.default(undefined))
    .addOption(COMMON_OPTIONS.outputOnly)
    .addOption(COMMON_OPTIONS.keypair)
    .addOption(COMMON_OPTIONS.config)
    .action(async (options, { args: passThroughArgs }) => {
      if (!options.outputOnly) {
        titleMessage("Deploy a Solana program");
      }

      // console.log("options");
      // console.log(options);

      await checkCommand("solana program --help", {
        exit: true,
        message: "Unable to detect the 'solana program' command",
      });

      if (!options.url) {
        // todo: we could give the user a prompt
        return warnMessage(`You must select cluster to deploy to. See --help`);
      }

      let config = loadConfigToml(
        options.config,
        options,
        true /* config required */,
      );

      const { programs, cargoToml } = autoLocateProgramsInWorkspace(
        options.manifestPath,
      );

      if (!cargoToml) return warnMessage(`Unable to locate Cargo.toml`);

      const buildDir = path.join(
        path.dirname(cargoToml.configPath),
        "target",
        "deploy",
      );

      if (!directoryExists(buildDir)) {
        return warnMessage(
          `Unable to locate your build dir: ${buildDir}` +
            `\nHave you built your programs?`,
        );
      }

      if (!options.programName) {
        // todo: we could give the user a prompt
        return warnMessage(`You must select a program to deploy. See --help.`);
      }

      if (!programs.has(options.programName)) {
        warnMessage(
          `Unable to locate program '${options.programName}' in this workspace`,
        );
        console.log(`The following programs were located:`);

        programs.forEach((_programPath, programName) =>
          console.log(" -", programName),
        );

        // todo: should we prompt the user to select a valid program?
        process.exit();
      }

      const binaryPath = path.join(buildDir, `${options.programName}.so`);
      if (!doesFileExist(binaryPath)) {
        // todo: we should detect if the program is declared and recommend building it
        return warnMessage(`Unable to locate program binary: ${binaryPath}`);
      }

      let programIdPath = path.join(
        buildDir,
        `${options.programName}-keypair.json`,
      );
      if (!doesFileExist(programIdPath)) {
        return warnMessage(
          `Unable to locate program keypair: ${programIdPath}`,
        );
      }

      const command = buildDeployProgramCommand({
        programPath: binaryPath,
        programId: programIdPath,
        url: options.url,
        keypair: options.keypair,
      });

      // todo: if options.url is localhost, verify the test validator is running

      // todo: if localhost deploy, support feature cloning to match a cluster

      shellExecInSession({
        command,
        args: passThroughArgs,
        outputOnly: options.outputOnly,
      });
    });
}

export default deployCommand;
