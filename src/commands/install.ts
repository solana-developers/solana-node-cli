import { Argument, Command, Option } from "@commander-js/extra-typings";
import {
  cliOutputConfig,
  successOutro,
  warnMessage,
  cancelMessage,
  titleMessage,
} from "@/lib/cli.js";
import { appendPathAndSourceIt, detectOperatingSystem } from "@/lib/shell";
import {
  checkInstalledTools,
  installAnchorVersionManager,
  installRust,
  installSolana,
  installAnchorUsingAvm,
} from "@/lib/setup";

type ToolNames = "all" | "rust" | "solana" | "avm" | "anchor";

const toolNames: Array<ToolNames> = ["all", "rust", "solana", "avm", "anchor"];

/**
 * Command: `setup`
 *
 * Setup your local machine for Solana development
 */
export default function installCommand() {
  // set the default action: `help` (without an error)
  // if (process.argv.length === 3) {
  // process.argv.push("all");
  // process.argv.push("--help");
  // }

  // todo: handle a default install command

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

        // console.log("run the install commands");
        // console.log("toolName:", toolName);
        // console.log("options:", options);

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

// /**
//  * Command: `install install`
//  *
//  * Install new versions of various Solana development tooling
//  */
// export function installCommand() {
//   return new Command("install")
//     .configureOutput(cliOutputConfig)
//     .description("install Solana development tooling")
//     .action(async () => {
//       titleMessage("Install Solana development tooling");

//       const os = detectOperatingSystem();

//       if (os == "windows") {
//         warnMessage(
//           "Windows is not yet natively supported for the rust based tooling.\n" +
//             "We recommend using WSL inside your Windows terminal.",
//         );
//       }

//       const tools = await checkInstalledTools({
//         outputToolStatus: true,
//       });

//       if (tools.allInstalled) {
//         return successOutro("All tools are installed!");
//       }

//       // todo: allow a command flag to force install

//       const install = await confirm({
//         message: "Install the missing tools?",
//         initialValue: true,
//       });

//       if (isCancel(install) || !install) {
//         cancelMessage();
//       }

//       // initialize a universal spinner to pass around
//       const progressSpinner = spinner();
//       progressSpinner.start("Starting tooling installation");

//       if (!tools.status.rust) {
//         const rustRes = await installRust({ spinner: progressSpinner });
//         console.log();
//       }

//       if (!tools.status.solana) {
//         const solanaRes = await installSolana({ spinner: progressSpinner });
//       }

//       if (!tools.status.avm) {
//         const avmRes = await installAnchorVersionManager({
//           spinner: progressSpinner,
//         });
//       }

//       if (!tools.status.anchor) {
//         const anchorRes = await installAnchorUsingAvm({
//           spinner: progressSpinner,
//         });
//       }

//       progressSpinner.stop("Tooling installed!");

//       successOutro();
//     });
// }
