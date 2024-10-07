/**
 * Helpers for setting up and managing a user's local environment
 */

import { ToolNames } from "@/types";
import { installedToolVersion } from "./shell";
import picocolors from "picocolors";

/**
 * Check for each of the installed tools on the user system
 */
export async function checkInstalledTools({
  outputToolStatus = false,
}: {
  outputToolStatus?: boolean;
} = {}) {
  // default to true since we set to false if any single tool is not installed
  let allInstalled = true;

  let status: { [key in ToolNames]: string | boolean } = {
    rust: false,
    solana: false,
    avm: false,
    anchor: false,
    yarn: false,
  };

  await Promise.all(
    Object.keys(status).map(async (tool: ToolNames) => {
      const version = await installedToolVersion(tool);
      status[tool] = version;
      if (!status[tool]) allInstalled = false;
    }),
  );

  if (outputToolStatus) {
    let noteContent = "";
    for (const command in status) {
      if (Object.prototype.hasOwnProperty.call(status, command)) {
        noteContent += "- ";
        if (status[command]) {
          noteContent += picocolors.green(command);
        } else {
          noteContent += picocolors.red(command);
        }
        noteContent += ` ${status[command] || "(not installed)"}\n`;
      }
    }
    console.log(noteContent.trim(), "\n");
  }

  return {
    allInstalled,
    status,
  };
}

/**
 *
 */
export function checkSystemDependencies() {}
