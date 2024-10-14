import fs from "fs";
import { readFileSync } from "fs";
import * as toml from "@iarna/toml";
import path from "path";
import { homedir } from "os";

/**
 *
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve tilde based file paths for the current user's home directory
 */
export function resolveTilde(filePath) {
  if (filePath.startsWith("~")) {
    return path.join(homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 *
 */
export function loadJsonFile<T = object>(filePath: string): T | null {
  try {
    const data = readFileSync(resolveTilde(filePath), "utf-8");
    const parsedData: T = JSON.parse(data);
    return parsedData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Error parsing JSON:", error.message);
    } else if (error.code === "ENOENT") {
      console.error("JSON file not found:", filePath);
    } else {
      console.error("Error reading JSON file:", error.message);
    }
    return null;
  }
}

/**
 *
 */
export function loadTomlFile<T>(filePath: string): T | null {
  try {
    const data = readFileSync(resolveTilde(filePath), "utf-8");
    // const parsedData: T = JSON.parse(data);

    // Parse the TOML content
    const parsedData = toml.parse(data);
    return parsedData as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Error parsing TOML:", error.message);
    } else if (error.code === "ENOENT") {
      console.error("TOML file not found:", filePath);
    } else {
      console.error("Error reading TOML file:", error.message);
    }
    return null;
  }
}

/**
 * Recursively create all the folders in a given file path
 */
export function createFolders(filePath: string, resolve: boolean = true) {
  filePath = resolveTilde(filePath);
  if (resolve) filePath = path.dirname(path.resolve(filePath));
  return fs.mkdirSync(filePath, { recursive: true });
}

/**
 * Check if a file exists in the local file system
 */
export function doesFileExist(...filePath: string[]): boolean {
  try {
    fs.statfsSync(path.resolve(...resolveTilde(filePath)));
    return true;
  } catch (err) {}
  return false;
}

/**
 *
 */
export function moveFiles(
  sourceDir: string,
  destinationDir: string,
  overwrite: boolean = false,
): void {
  // Read all the files in the source directory
  const files = fs.readdirSync(sourceDir);

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destinationDir)) {
    createFolders(destinationDir);
  }

  files.forEach((file) => {
    const sourceFile = path.join(sourceDir, file);
    const destinationFile = path.join(destinationDir, file);

    // Check if file already exists at destination
    if (fs.existsSync(destinationFile)) {
      if (!overwrite) {
        // console.log(`File ${file} already exists, skipping...`);
        return;
      }
      // Remove existing file if overwrite is allowed
      fs.unlinkSync(destinationFile);
    }

    // Move the file by renaming it
    fs.cpSync(sourceFile, destinationFile);
    // console.log(`Copied file: ${file}`);
  });

  //   console.log("File moving completed.");
}

/**
 * Load all the file names inside a directory into a hashmap
 */
export function loadFileNamesToMap(
  dir: string,
  extension?: string,
): Map<string, string> {
  const fileMap = new Map<string, string>();

  // Read all files from the specified directory
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    // Check if it is a file (not a directory)
    if (fs.statSync(filePath).isFile()) {
      const fileNameWithoutExt = path.basename(file, path.extname(file));

      // If an extension is specified, check if the file has that extension
      if (!extension || path.extname(file) === extension) {
        fileMap.set(fileNameWithoutExt, file); // Set without extension as key
      }
    }
  });

  return fileMap;
}
