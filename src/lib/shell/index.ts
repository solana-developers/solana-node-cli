import os, { userInfo } from "node:os";
import { PlatformOS, ToolNames } from "@/types";
import { TOOL_CONFIG } from "../setup";
import fs from "fs";
import path from "path";
import shellExec from "shell-exec";

/**
 * Check if a given command name is installed and available on the system
 */
export async function installedToolVersion(name: ToolNames) {
  let command: string = "";
  const regex = /(?:[\w-]+\s+)?(\d+\.\d+\.\d+)/;

  if (Object.prototype.hasOwnProperty.call(TOOL_CONFIG, name)) {
    command = TOOL_CONFIG[name].version;
    // auto source the command's binary dir into the $PATH
    if (TOOL_CONFIG[name].pathSource) {
      command = `export PATH="${TOOL_CONFIG[name].pathSource}:$PATH" && ${command}`;
    }
  }

  if (!command) return false;

  const res = await checkCommand(command);

  if (res) return regex.exec(res)[1] || res;
  return res;
}

/**
 * Attempt to run the given shell command, detecting if the command is available on the system
 */
export async function checkCommand(cmd: string) {
  try {
    const { stdout } = await shellExec(cmd);

    if (stdout) {
      return stdout.trim();
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Detect the users operating system
 */
export function detectOperatingSystem(): PlatformOS {
  switch (os.platform()) {
    case "darwin":
      return "mac";
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    default:
      return "unknown";
  }
}

/**
 * Add a new PATH value into the user's `.bashrc` or `.zshrc` files
 */
export function appendPathToRCFiles(
  newPath: string,
  name: string | undefined = undefined,
): void {
  // Get the home directory of the current user
  const homeDir = process.env.HOME || process.env.USERPROFILE;

  if (!homeDir) {
    console.error(
      "[appendPathToRCFiles]",
      "Unable to find the user home directory.",
    );
    return;
  }

  // List of potential RC files to check
  const rcFiles = [".bashrc", ".zshrc"].map((file) => path.join(homeDir, file));

  // The line to add to the RC file
  let exportLine = `export PATH=${newPath}:\$PATH\n`;

  // handle a better PATH flow to keep the PATH light and remove duplicates
  if (name) {
    const exportName = `${name.toUpperCase()}_HOME`;
    exportLine =
      `\n# ${name}\n` +
      `export ${exportName}="${newPath}"\n` +
      `case ":$PATH:" in\n` +
      `  *":$${exportName}:"*) ;;\n` +
      `  *) export PATH="$${exportName}:$PATH" ;;\n` +
      `esac\n` +
      `# ${name} end\n\n`;
  }

  rcFiles.forEach((rcFile) => {
    // Check if the RC file exists
    if (fs.existsSync(rcFile)) {
      // console.log(`Checking ${rcFile}...`);

      // Read the file contents
      const fileContent = fs.readFileSync(rcFile, "utf-8");

      // Check if the line is already present in the file
      if (!fileContent.includes(newPath)) {
        // Append the new export path to the RC file
        fs.appendFileSync(rcFile, exportLine);
        // console.log(`Appended PATH to ${rcFile}`);

        console.log("Run:\n", `export PATH=${newPath}:\$PATH\n`);
      } else {
        // console.log(`The path is already present in ${rcFile}`);
      }
    } else {
      // console.log(`${rcFile} not found.`);
    }
  });
}
