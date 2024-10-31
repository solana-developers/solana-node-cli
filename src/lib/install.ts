/**
 * Helpers for setting up a user's local environment
 */

import { InstallCommandPropsBase } from "@/types";
import { appendPathToRCFiles, installedToolVersion } from "@/lib/shell";
import shellExec from "shell-exec";
import ora from "ora";
import { TOOL_CONFIG } from "@/const/setup";

/**
 * Install the rust toolchain with Rustup
 */
export async function installRust({ version }: InstallCommandPropsBase = {}) {
  const spinner = ora("Installing the rust toolchain using Rustup").start();
  try {
    // we ALWAYS check for and update the PATH in the bashrc file
    appendPathToRCFiles(TOOL_CONFIG.rust.pathSource, "rust");

    let installedVersion = await installedToolVersion("rust");
    if (installedVersion) {
      spinner.info(`rust ${installedVersion} is already installed`);
      // todo: detect if the $PATH is actually loaded
      return true;
    }

    const result = await shellExec(
      `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`,
    );

    if (result && result.code != 0) {
      const error = result.stderr.trim().split("\n");

      // todo: we can handle any specific known install errors here

      // fallback to displaying the error
      throw error.join("\n");
    }

    spinner.text = "Verifying rust was installed";
    installedVersion = await installedToolVersion("rust");
    if (installedVersion) {
      spinner.succeed(`rust ${installedVersion} installed`);
      return installedVersion;
    } else {
      spinner.fail("rust failed to install");
      return false;
    }
  } catch (err) {
    spinner.fail("Unable to install rust");

    if (typeof err == "string") console.error(err);
    else if (err instanceof Error) console.error(err.message);
    else console.error(err.message);
  }

  return false;
}

/**
 * Install the Solana CLI tool suite
 */
export async function installSolana({
  version = "stable",
}: InstallCommandPropsBase = {}) {
  const spinner = ora("Installing the Solana CLI tool suite...").start();
  try {
    // we ALWAYS check for and update the PATH in the bashrc file
    appendPathToRCFiles(TOOL_CONFIG.solana.pathSource, "solana");

    let installedVersion = await installedToolVersion("solana");
    if (installedVersion) {
      spinner.info(`solana ${installedVersion} is already installed`);
      // todo: detect if the $PATH is actually loaded
      return true;
    }
    version = version.toLowerCase();
    if (version != "stable" && !version.startsWith("v")) {
      spinner.fail(`Invalid version: '${version}'`);
    }

    const result = await shellExec(
      // `sh -c "$(curl -sSfL https://release.solana.com/${version}/install)"`,
      `sh -c "$(curl -sSfL https://release.anza.xyz/${version}/install)"`,
    );

    if (result && result.code != 0) {
      const error = result.stderr.trim().split("\n");

      // todo: we can handle any specific known install errors here

      // fallback to displaying the error
      throw error.join("\n");
    }

    spinner.text = "Verifying solana was installed";
    installedVersion = await installedToolVersion("solana");
    if (installedVersion) {
      spinner.succeed(`solana ${installedVersion} installed`);
      return installedVersion;
    } else {
      spinner.fail("solana failed to install");
      return false;
    }
  } catch (err) {
    spinner.fail("Unable to install the Solana CLI tool suite");
    if (typeof err == "string") console.error(err);
    else if (err instanceof Error) console.error(err.message);
    else console.error(err.message);
  }

  return false;
}

/**
 * Install the anchor version manager (aka `avm`)
 */
export async function installAnchorVersionManager({
  version = "latest",
}: InstallCommandPropsBase = {}) {
  const spinner = ora("Installing avm (anchor version manager)").start();
  try {
    let installedVersion = await installedToolVersion("avm");
    if (installedVersion) {
      spinner.info(`avm ${installedVersion} is already installed`);
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

    const result = await shellExec(
      `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force`,
    );

    if (result && result.code != 0) {
      const error = result.stderr.trim().split("\n");

      // todo: we can handle any specific known install errors here

      // fallback to displaying the error
      throw error.join("\n");
    }

    spinner.text = "Verifying avm was installed";
    installedVersion = await installedToolVersion("avm");

    if (installedVersion) {
      spinner.succeed(`avm ${installedVersion} installed`);
      return installedVersion;
    } else {
      spinner.fail("avm failed to install");
      return false;
    }
  } catch (err) {
    spinner.fail("Unable to install avm");
    if (typeof err == "string") console.error(err);
    else if (err instanceof Error) console.error(err.message);
    else console.error(err.message);
  }

  return false;
}

/**
 * Install anchor via avm
 */
export async function installAnchorUsingAvm({
  verifyParentCommand = true,
  version = "latest",
}: InstallCommandPropsBase = {}) {
  const spinner = ora("Installing anchor using avm...").start();
  try {
    let installedVersion = await installedToolVersion("anchor");
    if (installedVersion && installedVersion == version) {
      spinner.info(`anchor ${installedVersion} is already installed`);
      return true;
    }

    spinner.text = `Verifying avm is installed`;
    const avmVersion = await installedToolVersion("avm");

    if (!avmVersion) {
      // todo: smart install avm?
      spinner.fail(`avm is NOT already installed`);
      // todo: better error response handling
      return false;
    } else {
      // todo: support other versions of anchor via avm
      version = avmVersion;
    }

    // note: intentionally recheck the version due to avm allowing tags like `stable`
    if (installedVersion && installedVersion == version) {
      spinner.info(`anchor ${installedVersion} is already installed`);
      return true;
    }

    let result: Awaited<ReturnType<typeof shellExec>>;

    try {
      spinner.text = `Installing anchor version '${version}'. This may take a few minutes...`;

      result = await shellExec(`avm install ${version}`);
    } catch (err) {
      throw "Unable to execute `avm install`";
    }

    // handle any `avm install` errors
    if (result && result.code != 0) {
      const error = result.stderr.trim().split("\n");

      // todo: we can handle any specific known install errors here

      // fallback to displaying the error
      throw error.join("\n");
    }

    try {
      spinner.text = "Setting anchor version with avm";
      result = await shellExec(`avm use ${version}`);
    } catch (err) {
      throw "Unable to execute `avm use`";
    }

    spinner.text = "Verifying anchor was installed";
    installedVersion = await installedToolVersion("anchor");
    if (installedVersion) {
      spinner.succeed(`anchor ${installedVersion} installed using avm`);
      return installedVersion;
    } else {
      spinner.fail("anchor failed to install");
      return false;
    }
  } catch (err) {
    spinner.fail("Unable to install anchor using avm");
    if (typeof err == "string") console.error(err);
    else if (err instanceof Error) console.error(err.message);
    else console.error(err.message);
  }
}

/**
 * Install the yarn package manager (since anchor uses yarn by default still)
 * note: we have to assume `npm` is already available
 */
export async function installYarn({}: InstallCommandPropsBase = {}) {
  const spinner = ora("Installing yarn package manager...").start();
  try {
    let installedVersion = await installedToolVersion("yarn");
    if (installedVersion) {
      spinner.info(`yarn ${installedVersion} is already installed`);
      return true;
    }

    await shellExec(`npm install -g yarn`);

    spinner.text = "Verifying yarn was installed";
    installedVersion = await installedToolVersion("yarn");
    if (installedVersion) {
      spinner.succeed(`yarn ${installedVersion} installed`);
      return installedVersion;
    } else {
      spinner.fail("yarn package manager failed to install");
      return false;
    }
  } catch (err) {
    spinner.fail("Unable to install yarn package manager");
    if (typeof err == "string") console.error(err);
    else if (err instanceof Error) console.error(err.message);
    else console.error(err.message);
  }

  return false;
}

/**
 * Install the trident fuzzer
 */
export async function installTrident({
  version = "latest",
  verifyParentCommand = true,
}: InstallCommandPropsBase = {}): Promise<boolean | string> {
  const spinner = ora("Installing trident (fuzzer)").start();
  try {
    let installedVersion = await installedToolVersion("trident");
    if (installedVersion) {
      spinner.info(`trident ${installedVersion} is already installed`);
      return true;
    }

    if (verifyParentCommand) {
      const isParentInstalled = await installedToolVersion("rust");
      if (!isParentInstalled) {
        spinner.fail("Rust/cargo was not found");
        throw "parent command not found";
      }
    }

    // note: trident requires `honggfuzz`
    const result = await shellExec(`cargo install honggfuzz trident-cli`);

    if (result && result.code != 0) {
      const error = result.stderr.trim().split("\n");

      // todo: we can handle any specific known install errors here

      // fallback to displaying the error
      throw error.join("\n");
    }

    spinner.text = "Verifying trident was installed";
    installedVersion = await installedToolVersion("trident");

    if (installedVersion) {
      spinner.succeed(`trident ${installedVersion} installed`);
      return installedVersion;
    } else {
      spinner.fail("trident failed to install");
      return false;
    }
  } catch (err) {
    spinner.fail("Unable to install the trident fuzzer");
    if (typeof err == "string") console.error(err);
    else if (err instanceof Error) console.error(err.message);
    else console.error(err.message);
  }

  return false;
}
