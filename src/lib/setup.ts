/**
 * Helpers for setting up a user's local environment
 */

import { InstallCommandPropsBase, ToolCommandConfig, ToolNames } from "@/types";
import { appendPathToRCFiles, installedToolVersion } from "./shell";
import picocolors from "picocolors";
import shellExec from "shell-exec";
import { errorMessage } from "./cli";
import ora from "ora";

export const TOOL_CONFIG: { [key in ToolNames]: ToolCommandConfig } = {
  rust: {
    pathSource: "$HOME/.cargo/env",
    version: "rustc --version",
  },
  solana: {
    pathSource: "$HOME/.local/share/solana/install/active_release/bin",
    version: "solana --version",
  },
  avm: {
    version: "avm --version",
  },
  anchor: {
    version: "anchor --version",
  },
  yarn: {
    version: "yarn --version",
  },
};

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

/**
 * Install the rust toolchain with Rustup
 */
export async function installRust({ version }: InstallCommandPropsBase = {}) {
  try {
    const spinner = ora("Installing the rust toolchain using Rustup").start();

    let installedVersion = await installedToolVersion("rust");
    if (installedVersion) {
      spinner.succeed(`rust ${installedVersion} is already installed`);
      // todo: detect if the $PATH is actually loaded
      return true;
    }

    await shellExec(
      `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`,
    );

    spinner.text = "Verifying rust was installed";
    installedVersion = await installedToolVersion("rust");
    if (installedVersion) {
      spinner.succeed(`rust ${installedVersion} installed`);
      // todo: display the source $PATH command
      // TOOL_CONFIG.rust.pathSource

      appendPathToRCFiles(TOOL_CONFIG.rust.pathSource, "rust");

      return installedVersion;
    } else {
      spinner.fail("rust failed to install");
      return false;
    }
  } catch (err) {
    console.warn("Unable to install the rust");
  }

  return false;
}

/**
 * Install the Solana CLI tool suite
 */
export async function installSolana({
  version = "stable",
}: InstallCommandPropsBase = {}) {
  try {
    const spinner = ora("Installing the Solana CLI tool suite...").start();

    let installedVersion = await installedToolVersion("solana");
    if (installedVersion) {
      spinner.succeed(`solana ${installedVersion} is already installed`);
      // todo: detect if the $PATH is actually loaded
      return true;
    }
    version = version.toLowerCase();
    if (version != "stable" && !version.startsWith("v")) {
      spinner.fail(`Invalid version: '${version}'`);
    }

    await shellExec(
      // `sh -c "$(curl -sSfL https://release.solana.com/${version}/install)"`,
      `sh -c "$(curl -sSfL https://release.anza.xyz/${version}/install)"`,
    );

    spinner.text = "Verifying solana was installed";
    installedVersion = await installedToolVersion("solana");
    if (installedVersion) {
      spinner.succeed(`solana ${installedVersion} installed`);
      // todo: display the source $PATH command
      // TOOL_CONFIG.solana.pathSource

      appendPathToRCFiles(TOOL_CONFIG.solana.pathSource, "solana");

      return installedVersion;
    } else {
      spinner.fail("solana failed to install");
      return false;
    }
  } catch (err) {
    console.warn("Unable to install the Solana CLI tool suite");
  }

  return false;
}

/**
 * Install the anchor version manager (aka `avm`)
 */
// export async function installAnchorVersionManager({
//   spinner,
//   verifyParentCommand,
// }: InstallCommandPropsBase) {
export async function installAnchorVersionManager({
  verifyParentCommand = true,
  version = "latest",
}: InstallCommandPropsBase = {}) {
  try {
    const spinner = ora("Installing avm (anchor version manager)").start();

    let installedVersion = await installedToolVersion("avm");
    if (installedVersion) {
      spinner.succeed(`avm ${installedVersion} is already installed`);
      // todo: do we want to help people update avm?
      return true;
    }

    // if (verifyParentCommand) {
    //   // if ()
    //   const isParentInstalled = await installedToolVersion("rust");
    //   if (!isParentInstalled) {
    //     // todo: better error response handling
    //     return "rust/cargo was not found";
    //   }
    // }

    // const version = "v1.18.3";
    // const version = "stable";

    const res = await shellExec(
      `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force`,
    );

    // console.log(res);

    // if (res.stdout) {
    // todo: check the `path` and ensure it was fully setup
    // todo: manually add the path info to the user's bashrc

    spinner.text = "Verifying avm was installed";

    installedVersion = await installedToolVersion("avm");
    // console.log("\ninstalledVersion:", installedVersion);

    if (installedVersion) {
      spinner.succeed(`avm ${installedVersion} installed`);
      return installedVersion;
    } else {
      spinner.fail("avm failed to install");
      // console.log(result);

      return false;
    }

    //   return true;
    // }
  } catch (err) {
    console.warn("Unable to install the Solana CLI tool suite");
  }

  return false;
}

export async function installAnchorUsingAvm({
  verifyParentCommand = true,
  version = "latest",
}: InstallCommandPropsBase = {}) {
  try {
    const spinner = ora("Installing Anchor using AVM...").start();

    let installedVersion = await installedToolVersion("anchor");
    if (installedVersion && installedVersion == version) {
      spinner.succeed(`anchor ${installedVersion} is already installed`);
      return true;
    }

    if (verifyParentCommand) {
      spinner.text = `Verifying avm is installed`;

      const isParentInstalled = await installedToolVersion("avm");
      if (!isParentInstalled) {
        // todo: smart install avm?
        spinner.fail(`avm is not already installed`);
        // todo: better error response handling
        return false;
      }
    }

    // let result: ExecaReturnValue<string> | undefined;
    let result: Awaited<ReturnType<typeof shellExec>>;

    try {
      spinner.text = `Installing Anchor version '${version}'. This may take a few minutes...`;

      result = await shellExec(`avm install ${version}`);
    } catch (err) {
      spinner.fail("Unable to execute `avm install`");
      errorMessage(err);
    }

    try {
      spinner.text = "Setting anchor version with AVM";
      result = await shellExec(`avm use ${version}`);
    } catch (err) {
      spinner.fail("Unable to execute `avm use`");
      errorMessage(err);
    }

    spinner.text = "Verifying Anchor was installed";
    installedVersion = await installedToolVersion("anchor");
    if (installedVersion) {
      spinner.succeed(`anchor ${installedVersion} installed using AVM`);
      return installedVersion;
    } else {
      spinner.fail("anchor failed to install");
      return false;
    }
  } catch (err) {
    throw Error("Unable to install anchor using avm");
  }
}