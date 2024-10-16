import { Command } from "@commander-js/extra-typings";
import {
  cliOutputConfig,
  successOutro,
  warnMessage,
  cancelMessage,
  titleMessage,
} from "@/lib/cli.js";
import { detectOperatingSystem } from "@/lib/shell";
import { checkInstalledTools } from "@/lib/setup";

/**
 * Command: `setup`
 *
 * Setup your local machine for Solana development
 */
export default function setupCommand() {
  return new Command("setup")
    .configureOutput(cliOutputConfig)
    .description(
      "setup your local machine for Solana development",
      // "Install the local tooling and setup your local machine for Solana development",
    )
    .addCommand(setupListCommand());
}

/**
 * Command: `setup list`
 *
 * List the current installed versions of Solana development tooling
 */
export function setupListCommand() {
  return new Command("list")
    .configureOutput(cliOutputConfig)
    .description("list the current versions of Solana development tooling")
    .action(async () => {
      // titleMessage("Solana development tooling");

      const os = detectOperatingSystem();

      if (os == "windows") {
        warnMessage(
          "Windows is not yet natively supported for the rust based tooling.\n" +
            "We recommend using WSL inside your Windows terminal.",
        );
      }

      const tools = await checkInstalledTools({
        outputToolStatus: true,
      });

      if (tools.allInstalled) {
        return successOutro("All tools are installed!");
      }

      // todo: allow a command flag to force install

      // todo: ask the user if they want to install missing tools?

      successOutro();
    });
}
