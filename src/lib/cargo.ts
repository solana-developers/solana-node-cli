/**
 * Assorted helper functions and wrappers for working in the CLI
 */

import { CargoTomlWithConfigPath } from "@/types/cargo";
import { directoryExists, doesFileExist, loadTomlFile } from "./utils";
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";

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

export function findAllCargoToml(
  startDir: string,
  whitelist: string[] = [],
  blacklist: string[] = ["node_modules", "dist", "target"],
  maxDepth: number = 3,
): string[] {
  const cargoTomlPaths: string[] = [];

  // Convert whitelist patterns to regular expressions for wildcard matching
  const whitelistPatterns = whitelist.map(
    (pattern) => new RegExp("^" + pattern.replace(/\*/g, ".*") + "$"),
  );

  // Helper function to check if a directory matches any whitelist pattern
  function isWhitelisted(relativeDir: string): boolean {
    if (whitelistPatterns.length === 0) {
      return true;
    }
    return whitelistPatterns.some((regex) => regex.test(relativeDir));
  }

  // Helper function to recursively search directories
  function searchDir(dir: string, depth: number): void {
    // Stop searching if maxDepth is reached
    if (depth > maxDepth) {
      return;
    }

    const items = readdirSync(dir);
    for (const item of items) {
      const itemPath = join(dir, item);
      const stats = statSync(itemPath);

      if (stats.isFile() && item === "Cargo.toml") {
        cargoTomlPaths.push(itemPath);
      }

      if (stats.isDirectory()) {
        const relativeDir = relative(startDir, itemPath);

        if (blacklist.includes(relativeDir) && !isWhitelisted(relativeDir)) {
          continue;
        }

        searchDir(itemPath, depth + 1);
      }
    }
  }

  searchDir(startDir, 0);

  return cargoTomlPaths;
}
