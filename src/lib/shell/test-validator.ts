import { spawn } from "child_process";
import {
  createFolders,
  directoryExists,
  loadFileNamesToMap,
  moveFiles,
} from "../utils";
import { resolve } from "path";
import { loadKeypairFromFile } from "../solana";

type BuildTestValidatorCommandInput = {
  reset?: boolean;
  accountDir?: string;
  ledgerDir?: string;
  authority?: string;
};

export function buildTestValidatorCommand({
  reset,
  accountDir = "accounts",
  ledgerDir = "test-ledger",
  authority = loadKeypairFromFile().publicKey.toBase58(),
}: BuildTestValidatorCommandInput = {}) {
  const command: string[] = ["solana-test-validator"];

  if (reset) command.push("--reset");

  // auto load in the account from the provided json files
  if (accountDir) {
    accountDir = resolve(accountDir);

    if (directoryExists(accountDir)) {
      // clone the dir to a different temp location
      const tmpDir = resolve(".cache/load/accounts");
      createFolders(tmpDir, false);
      moveFiles(accountDir, tmpDir, true);

      // todo: update/reset the required account values (like `data` and maybe `owners`)

      command.push(`--account-dir ${tmpDir}`);

      // get the list of all the local binaries
      const clonedPrograms = loadFileNamesToMap(accountDir, ".so");
      clonedPrograms.forEach((_value, address) => {
        // console.log(`address: ${address}`),

        // todo: what is the real difference between using `--upgradeable-program` and `--bpf-program` here?

        if (authority) {
          // todo: support setting a custom authority for each program (reading it from the config toml)
          command.push(
            `--upgradeable-program ${address}`,
            resolve(accountDir, `${address}.so`),
            authority,
          );
        } else {
          command.push(
            `--bpf-program ${address}`,
            resolve(accountDir, `${address}.so`),
          );
        }
      });

      // todo: support loading in local binaries via `--bpf-program`
    } else {
      console.warn("Account dir does not exist:", accountDir);
      console.warn("Skipping cloning accounts");
    }
  }

  if (ledgerDir) {
    createFolders(ledgerDir);
    command.push(`--ledger ${ledgerDir}`);
  }

  // todo: support cloning programs via `--clone-upgradeable-program`?

  return command.join(" ");
}

type RunTestValidatorInput = {
  command?: string;
  args?: string[];
};

export function runTestValidator({ command, args }: RunTestValidatorInput) {
  console.log(""); // print a line separator

  // Spawn a child process
  const child = spawn(command, args, {
    detached: false, // run the command in the same session
    stdio: "inherit", // Stream directly to the user's terminal
    shell: true, // Runs in shell for compatibility with shell commands
    // cwd: // todo: do we want this?
  });

  // Handle child process events
  child.on("error", (err) => {
    console.error(`Failed to start the command: ${err.message}`);
  });

  child.on("exit", (code) => {
    if (code === 0) {
      console.log("Command executed successfully.");
    } else {
      console.error(`Command exited with code ${code}`);
    }
  });
}
