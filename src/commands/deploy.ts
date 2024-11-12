import path from "path";
import { Command, Option } from "@commander-js/extra-typings";
import { COMMON_OPTIONS } from "@/const/commands";
import { cliOutputConfig, loadConfigToml } from "@/lib/cli";
import { cancelMessage, titleMessage, warnMessage } from "@/lib/logs";
import { checkCommand, shellExecInSession } from "@/lib/shell";
import {
  buildDeployProgramCommand,
  getDeployedProgramInfo,
} from "@/lib/shell/deploy";
import { autoLocateProgramsInWorkspace } from "@/lib/cargo";
import { directoryExists, doesFileExist } from "@/lib/utils";
import { getSafeClusterMoniker, loadKeypairFromFile } from "@/lib/solana";

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
    .addOption(COMMON_OPTIONS.url)
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

      const selectedCluster = getSafeClusterMoniker(options.url);
      if (!selectedCluster) {
        return warnMessage(`Unable to parse cluster url: ${options.url}`);
      }

      // make sure the user has the cluster program declared
      if (!getSafeClusterMoniker(selectedCluster, config.programs)) {
        warnMessage(
          `Unable to locate '${selectedCluster}' programs your Solana.toml`,
        );

        console.log("The following programs are declared:");
        Object.keys(config.programs).forEach((cl) => {
          console.log(` - ${cl}:`);
          Object.keys(config.programs[cl]).forEach((name) => {
            console.log(`    - ${name}`);
          });
        });

        process.exit();
      }

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

      // auto select the program name for single program repos
      if (!options.programName && programs.size == 1) {
        options.programName = programs.entries().next().value[0];
      }

      if (
        !config?.programs?.[selectedCluster] ||
        !Object.hasOwn(config.programs[selectedCluster], options.programName)
      ) {
        return warnMessage(
          `Program '${options.programName}' not found in 'programs.${selectedCluster}'`,
        );
      }

      // ensure the selected program directory exists in the workspace
      if (!programs.has(options.programName) || !options.programName) {
        if (!options.programName) {
          // todo: we could give the user a prompt
          warnMessage(`You must select a program to deploy. See --help.`);
        } else if (!programs.has(options.programName)) {
          warnMessage(
            `Unable to locate program '${options.programName}' in this workspace`,
          );
        }

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
        // todo: or we could generate a fresh one?
        warnMessage(`Unable to locate program binary:\n${binaryPath}`);
        return warnMessage(`Have you built your programs?`);
      }

      let programId = config.programs[selectedCluster][options.programName];
      let programIdPath: string | null = null;
      let programInfo = await getDeployedProgramInfo(programId, options.url);

      /**
       * when programInfo exists, we assume the program is already deployed
       * (either from the user's current machine or not)
       */
      if (!programInfo) {
        // not-yet-deployed programs require a keypair to deploy for the first time
        warnMessage(
          `Program ${options.programName} (${programId}) is NOT already deployed on ${selectedCluster}`,
        );

        programIdPath = path.join(
          buildDir,
          `${options.programName}-keypair.json`,
        );
        warnMessage(
          `Falling back to the program keypair path: ${programIdPath}`,
        );
        if (!doesFileExist(programIdPath)) {
          return warnMessage(
            `Unable to locate program keypair: ${programIdPath}`,
          );
        }

        const programIdFromKeypair =
          loadKeypairFromFile(programIdPath).publicKey.toBase58();
        if (programIdFromKeypair !== programId) {
          warnMessage(
            `The loaded program keypair (${programIdFromKeypair}) does NOT match the configured programId (${programId})`,
          );
          // todo: should we prompt the user if they want to proceed
        }
        programId = programIdFromKeypair;
        programInfo = await getDeployedProgramInfo(programId, options.url);
      }

      // console.log("programInfo:", programInfo);
      const authorityKeypair = loadKeypairFromFile(config.settings.keypair);

      /**
       * todo: assorted pre-deploy checks to add
       * + is program already deployed
       * + is program frozen
       * - do you have the upgrade authority
       * - is the upgrade authority a multi sig?
       * - do you have enough sol to deploy ?
       */
      if (programInfo) {
        if (!programInfo.authority) {
          return cancelMessage(
            `Program ${programInfo.programId} is no longer upgradeable`,
          );
        }

        if (programInfo.authority !== authorityKeypair.publicKey.toBase58()) {
          return cancelMessage(
            `Your keypair (${authorityKeypair.publicKey.toBase58()}) is not the upgrade authority for program ${programId}`,
          );
        }

        programId = programInfo.programId;
      } else {
        // todo: do we need to perform any checks if the program is not already deployed?
      }

      const command = buildDeployProgramCommand({
        programPath: binaryPath,
        programId: programIdPath || programId,
        url: options.url,
        keypair: options.keypair,
      });

      // todo: if options.url is localhost, verify the test validator is running

      // todo: if localhost deploy, support feature cloning to match a cluster

      /**
       * todo: if deploying to mainnet, we should add some "confirm" prompts
       * - this is the program id
       * - this is the upgrade authority
       * - estimated cost (you have X sol)
       * do you want to continue?
       */

      shellExecInSession({
        command,
        args: passThroughArgs,
        outputOnly: options.outputOnly,
      });
    });
}

export default deployCommand;
