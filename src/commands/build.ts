import { join } from "path";
import { Command, Option } from "@commander-js/extra-typings";
import { cliOutputConfig, titleMessage, warningOutro } from "@/lib/cli.js";
import { checkCommand } from "@/lib/shell";
import { COMMON_OPTIONS } from "@/const/commands";
import { loadCargoToml } from "@/lib/cargo";
import { buildProgramCommand } from "@/lib/shell/build";
import { spawn } from "child_process";
import { doesFileExist } from "@/lib/utils";

/**
 * Command: `build`
 *
 * Build the programs located in the user's repo
 */
export function buildCommand() {
  return new Command("build")
    .configureOutput(cliOutputConfig)
    .description("build your Solana programs")
    .addOption(
      new Option(
        "-p --program-name <PROGRAM_NAME>",
        "name of the program to build",
      ),
    )
    .addOption(
      new Option("--manifest-path <PATH>", "path to Cargo.toml").default(
        join(process.cwd(), "Cargo.toml"),
      ),
    )
    .addOption(COMMON_OPTIONS.config)
    .action(async (options) => {
      titleMessage("Build your Solana programs");

      // console.log("options:");
      // console.log(options);

      await checkCommand("cargo build-sbf --help", {
        exit: true,
        message:
          "Unable to detect the 'cargo build-sbf' command. Do you have it installed?",
      });

      // when a specific program is not provided, attempt to build the workspace
      // if (!options.programName) {}

      // determine if we are in a program specific dir or the workspace
      let cargoToml = loadCargoToml(options.manifestPath);

      if (!cargoToml) {
        // console.log("todo: attempt to locate all cargo toml files");

        const commonDirs = ["programs/", "program/"];

        commonDirs.some((workspace) => {
          const filePath = join(process.cwd(), workspace, "Cargo.toml");
          if (doesFileExist(filePath)) {
            cargoToml = loadCargoToml(filePath);
            if (cargoToml) return;
          }
        });
      }

      if (!cargoToml) {
        return warningOutro(
          `Unable to locate any Cargo.toml file. Operation canceled.`,
        );
      }

      let buildCommand: null | string = null;

      if (cargoToml.workspace) {
        buildCommand = buildProgramCommand({
          // no manifest file will attempt to build the whole workspace
          manifestPath: cargoToml.configPath,
          workspace: true,
        });
      } else if (
        cargoToml.package &&
        cargoToml.lib["crate-type"].includes("lib")
      ) {
        buildCommand = buildProgramCommand({
          // a single program manifest will build only that one program
          manifestPath: cargoToml.configPath,
        });
      } else {
        return warningOutro(`Unable to locate any program's Cargo.toml file`);
      }

      // join(programs[programName].dirPath, "Cargo.toml")

      console.log("buildCommand:");
      console.log(buildCommand);

      if (!buildCommand) {
        return warningOutro(`Unable to create build command`);
      }

      const child = spawn(buildCommand, undefined, {
        detached: false, // run the command in the same session
        stdio: "inherit", // Stream directly to the user's terminal
        shell: true, // Runs in shell for compatibility with shell commands
      });

      //   for (let i = 0; i < programsToBuild.length; i++) {
      //     const programName = programsToBuild[i];

      //     const spinner = ora(`Building program '${programName}'`).start();

      //     // console.log("build command:");
      //     const buildCommand = buildProgramCommand({
      //       manifestPath: join(programs[programName].dirPath, "Cargo.toml"),
      //     });

      //     const buildStatus = await runBuildCommand({
      //       programName,
      //       command: buildCommand,
      //     });

      //     if (buildStatus == true) {
      //       spinner.succeed(`Build complete: ${programName}`);
      //     } else {
      //       spinner.fail(`Build failed: ${programName}`);
      //     }
      //   }
    });
}

export default buildCommand;
