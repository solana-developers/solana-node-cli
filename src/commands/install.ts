import { Argument, Command } from "@commander-js/extra-typings";
import {
  cliOutputConfig,
  successOutro,
  warnMessage,
  cancelMessage,
  titleMessage,
} from "@/lib/cli.js";
import { detectOperatingSystem } from "@/lib/shell";
import {
  installAnchorVersionManager,
  installRust,
  installSolana,
  installAnchorUsingAvm,
} from "@/lib/install";
import { checkInstalledTools } from "@/lib/setup";

type ToolNames = "all" | "rust" | "solana" | "avm" | "anchor";

const toolNames: Array<ToolNames> = ["all", "rust", "solana", "avm", "anchor"];

/**
 * Command: `install`
 *
 * Setup your local machine for Solana development
 */
export default function installCommand() {
  // set the default tool to `all`
  if (process.argv.length === 3) {
    process.argv.push("all");
  }

  return (
    new Command("install")
      .configureOutput(cliOutputConfig)
      .description("install Solana development tooling")
      .addArgument(new Argument("<tool>", "tool name").choices(toolNames))
      .addArgument(new Argument("[version]", "desired tool version to install"))
      // .addOption(
      //   new Option(
      //     "--dry-run",
      //     "only check the versions of the installed tools, do not actually install anything",
      //   ).implies({
      //     drink: "small",
      //   }),
      // )
      .action(async (toolName, version, options) => {
        titleMessage("Install Solana development tooling");

        const os = detectOperatingSystem();

        if (os == "windows") {
          warnMessage(
            "Windows is not yet natively supported for the rust based tooling.\n" +
              "We recommend using WSL inside your Windows terminal.",
          );
        }

        const tools = await checkInstalledTools({
          // outputToolStatus: toolName == "all",
          outputToolStatus: false,
        });

        // if (tools.allInstalled) {
        //   return successOutro("All tools are installed!");
        // }

        if (toolName == "rust" || toolName == "all") {
          await installRust({
            os,
            version,
          });
        }
        if (toolName == "solana" || toolName == "all") {
          await installSolana({
            os,
            version,
          });
        }
        if (toolName == "avm" || toolName == "all") {
          // const version = "0.28.0"; //"latest"; // v0.29.0 has the "ahash yanked" issue
          await installAnchorVersionManager({
            os,
            version,
          });
        }
        if (toolName == "anchor" || toolName == "all") {
          await installAnchorUsingAvm({
            os,
            version,
          });
        }

        // if (tools.allInstalled) {
        //   return successOutro("All tools are installed!");
        // }

        // if (options.drink !== undefined) console.log(`drink: ${options.drink}`);

        // if (tool)
      })
  );

  // .addCommand(setupInstallCommand())
}
