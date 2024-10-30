import { join } from "path";
import { Command, Option } from "@commander-js/extra-typings";
import {
  cliOutputConfig,
  titleMessage,
  warningOutro,
  warnMessage,
} from "@/lib/cli.js";
import { checkCommand } from "@/lib/shell";
import { COMMON_OPTIONS } from "@/const/commands";
import { getProgramPathsInWorkspace, loadCargoToml } from "@/lib/cargo";
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
    .addOption(COMMON_OPTIONS.outputOnly)
    .action(async (options) => {
      if (!options.outputOnly) {
        titleMessage("Build your Solana programs");
      }

      // console.log("options:");
      // console.log(options);

      await checkCommand("cargo build-sbf --help", {
        exit: true,
        message:
          "Unable to detect the 'cargo build-sbf' command. Do you have it installed?",
      });

      // determine if we are in a program specific dir or the workspace
      let cargoToml = loadCargoToml(options.manifestPath);

      let workspaceDirs = ["temp", "programs/*", "program"];
      if (!cargoToml) {
        workspaceDirs.some((workspace) => {
          const filePath = join(
            process.cwd(),
            workspace.replace(/\*+$/, ""),
            "Cargo.toml",
          );
          if (doesFileExist(filePath)) {
            cargoToml = loadCargoToml(filePath);
            if (cargoToml) return;
          }
        });
      }

      if (cargoToml) {
        // always update the current manifest path to the one of the loaded Cargo.toml
        if (cargoToml.configPath) {
          options.manifestPath = cargoToml.configPath;
        }

        if (cargoToml.workspace?.members) {
          workspaceDirs = cargoToml.workspace.members;
        }
      }

      const programs = getProgramPathsInWorkspace(
        options.manifestPath,
        workspaceDirs,
      );

      // only build a single program
      if (options.programName) {
        if (
          programs.has(options.programName) &&
          doesFileExist(programs.get(options.programName))
        ) {
          cargoToml = loadCargoToml(programs.get(options.programName));
        } else {
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
      }

      if (!cargoToml) {
        return warningOutro(
          `Unable to locate Cargo.toml file. Operation canceled.`,
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

      if (!buildCommand) {
        return warningOutro(`Unable to create build command`);
      }

      if (options.outputOnly) {
        console.log(buildCommand);
        process.exit();
      }

      // execute the build command using a normal shell, allowing the user to CTRL+C to cancel
      spawn(buildCommand, undefined, {
        detached: false, // run the command in the same session
        stdio: "inherit", // Stream directly to the user's terminal
        shell: true, // Runs in shell for compatibility with shell commands
      });
    });
}

export default buildCommand;
