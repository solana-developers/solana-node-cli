/**
 * Assorted helper functions and wrappers for working in the CLI
 */

import { CargoTomlWithConfigPath } from "@/types/cargo";
import { directoryExists, doesFileExist, loadTomlFile } from "./utils";
import { join } from "path";

const DEFAULT_CARGO_TOML_FILE = "Cargo.toml";

type BuildProgramMetadata = {
  found: boolean;
  dirPath: string;
  address: string;
};

/**
 * Load a Cargo.toml file
 */
export function loadCargoToml(
  manifestPath: string = DEFAULT_CARGO_TOML_FILE,
  settings: object = {},
  isManifestRequired: boolean = false,
): CargoTomlWithConfigPath | false {
  // allow the config path to be a directory, with a Solana.toml in it
  if (directoryExists(manifestPath)) {
    manifestPath = join(manifestPath, DEFAULT_CARGO_TOML_FILE);
  }

  if (doesFileExist(manifestPath, true)) {
    return loadTomlFile<CargoTomlWithConfigPath>(manifestPath);
  } else {
    return false;
    // if (isManifestRequired) {
    //   warningOutro(`No Cargo.toml file found. Operation canceled.`);
    // } else warnMessage(`No Cargo.toml file found. Skipping.`);
  }
}

/**
 * Attempt to locate all the program directories within all the listed workspaces
 */
export function locateProgramsInWorkspace({
  workspaces = ["programs/", "program/"],
  workingDir = process.cwd(),
  declaredPrograms,
}: {
  workspaces: string[];
  workingDir: string;
  declaredPrograms: Record<string, string>;
}) {
  const programs: {
    [key: string]: BuildProgramMetadata;
  } = {};

  workspaces.forEach((workspace) => {
    workspace = join(workingDir, workspace).replace(/\*+$/, "");
    if (!directoryExists(workspace)) return;

    /**
     * if the dir exists, its either a listing of program dirs or a single program
     */
    if (doesFileExist(join(workspace, "Cargo.toml"))) {
      const programCargoToml = loadCargoToml(join(workspace, "Cargo.toml"));

      console.log("programCargoToml:", programCargoToml);
    } else {
      Object.keys(declaredPrograms).forEach((key) => {
        const program: BuildProgramMetadata = {
          found: false,
          dirPath: join(workspace, key),
          address: declaredPrograms[key],
        };

        if (directoryExists(program.dirPath)) {
          program.found = true;
        } else {
          // warnMessage(`Missing program directory: ${key}`);
        }
        programs[key] = program;
      });
    }
  });

  return programs;
}
