import fs from "fs";
import * as toml from "@iarna/toml";
import path from "path";
import { homedir } from "os";
import { warnMessage } from "./cli";

/**
 *
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve tilde based file paths for the current user's home directory
 */
export function resolveTilde(filePath: string) {
  if (filePath.startsWith("~")) {
    return path.join(homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Load a plaintext file from the local filesystem
 */
export function loadPlaintextFile(filePath: string): string | null {
  try {
    const data = fs.readFileSync(resolveTilde(filePath), "utf-8");
    return data;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("File not found:", filePath);
    } else {
      console.error("Error reading file:", error.message);
    }
    return null;
  }
}

/**
 *
 */
export function loadJsonFile<T = object>(filePath: string): T | null {
  try {
    const data = loadPlaintextFile(filePath);
    const parsedData: T = JSON.parse(data);
    return parsedData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Error parsing JSON:", error.message);
    }
    return null;
  }
}

/**
 *
 */
export function loadTomlFile<T>(filePath: string): T | null {
  try {
    const data = loadPlaintextFile(filePath);
    const parsedData = toml.parse(data);
    return parsedData as T;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Error parsing TOML:", error.message);
    }
    return null;
  }
}

/**
 * Recursively create all the folders in a given file path
 */
export function createFolders(filePath: string, resolve: boolean = true) {
  filePath = resolveTilde(filePath);
  if (resolve) {
    filePath = path.resolve(filePath);
    if (path.basename(filePath).includes("."))
      filePath = path.dirname(filePath);
  }
  return fs.mkdirSync(filePath, { recursive: true });
}

/**
 * Check if a file exists in the local file system
 */
export function doesFileExist(
  filePath: string,
  resolve: boolean = true,
): boolean {
  try {
    filePath = resolveTilde(filePath);
    if (resolve) filePath = path.resolve(filePath);
    fs.statfsSync(filePath);
    return true;
  } catch (err) {}
  return false;
}

/**
 * Check if a directory exists
 */
export function directoryExists(directoryPath: string): boolean {
  try {
    const stat = fs.statSync(resolveTilde(directoryPath));
    return stat.isDirectory();
  } catch (err) {
    // if there's an error, assume directory doesn't exist
    return false;
  }
}

/**
 *
 */
export function moveFiles(
  sourceDir: string,
  destinationDir: string,
  overwrite: boolean = false,
): void {
  if (!directoryExists(sourceDir)) {
    warnMessage(`[moveFiles] Source directory does not exist: ${sourceDir}`);
    return;
  }

  // Read all the files in the source directory
  const files = fs.readdirSync(sourceDir);

  // Create destination directory if it doesn't exist
  if (!directoryExists(destinationDir)) {
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

  if (!directoryExists(dir)) return fileMap;

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

/**
 * Check/update a gitignore file for specific items
 */
export function updateGitignore(
  items: string[],
  gitignorePath: string = path.join(process.cwd(), ".gitignore"),
): void {
  let gitignoreContent: string = "";

  if (doesFileExist(gitignorePath)) {
    gitignoreContent = loadPlaintextFile(gitignorePath);
  }

  const gitignoreLines = gitignoreContent
    .split("\n")
    .map((line) => line.trim());
  let updated = false;

  items.forEach((item) => {
    if (!gitignoreLines.includes(item.trim())) {
      gitignoreContent += `\n${item.trim()}`;
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(gitignorePath, gitignoreContent.trim() + "\n", "utf-8");
  }
}

export function findFileInRepo(
  targetFilename: string,
  startDir: string = process.cwd(),
  maxDepth: number = 5 /* depth=5 should be good enough to handle most repos? */,
  skipDirs: string[] = ["node_modules", ".cache"],
): string | null {
  let currentDir = startDir;
  let depth = 0;

  while (depth < maxDepth) {
    const filePath = findFileInDirectory(
      currentDir,
      targetFilename.toLowerCase(),
      skipDirs,
    );
    if (filePath) return filePath;

    // stop searching once we hit the repository root
    const gitDir = path.join(currentDir, ".git");
    if (fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory()) {
      return null;
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
    depth++;
  }

  return null;
}

export function findFileInDirectory(
  dir: string,
  targetFilename: string,
  skipDirs: string[],
): string | null {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const absolutePath = path.join(dir, file);

    if (fs.statSync(absolutePath).isDirectory()) {
      if (skipDirs.includes(file)) {
        continue;
      }

      const result = findFileInDirectory(
        absolutePath,
        targetFilename,
        skipDirs,
      );
      if (result) return result; // Found in a subdirectory
    } else if (file.toLowerCase() === targetFilename) {
      return absolutePath;
    }
  }

  return null;
}

export function isInCurrentDir(filePath: string): boolean {
  return path.resolve(process.cwd()) === path.resolve(path.dirname(filePath));
}
