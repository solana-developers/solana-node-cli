import { spawn } from "child_process";
import path from "path";
import shellExec from "shell-exec";
import {
  createFolders,
  doesFileExist,
  loadFileNamesToMap,
  loadJsonFile,
} from "../utils";
import { CloneSettings, SolanaCluster, SolanaToml } from "@/types/config";

export type JsonAccountStruct = {
  pubkey: string;
  account: JsonAccountInfo;
};

type JsonAccountInfo = {
  lamports: number;
  // Array with the first element being a base64 string and the second element specifying the encoding format
  data: [string, string | "base64"];
  owner: string;
  executable: boolean;
  rentEpoch: number;
  space: number;
};

// todo: create interface for common Clone input fields
type CloneAccountInput = {
  save?: true;
  saveDir?: string;
  address: string;
  url?: SolanaCluster | string;
};

type CloneProgramInput = {
  save?: true;
  saveDir?: string;
  address: string;
  url?: SolanaCluster | string;
};

export async function cloneAccount({
  address,
  save,
  saveDir = "accounts",
  url,
}: CloneAccountInput | undefined) {
  let command: string[] = [
    // comment for better diffs
    `solana account ${address}`,
    "--output json",
    // todo: enable this for production, maybe handled with a verbose mode or something?
    // "--output json-compact",
  ];

  /**
   * note: when no cluster is specified, the users `solana config` url will be used
   *
   * todo: we might want to force use a specific one or not. need to do more research/thinking on it
   */
  if (url) {
    if (url.startsWith("local")) url = "localhost";
    command.push(`--url ${url}`);
  }

  /**
   * todo: should we force save by default? i think so...
   *
   * todo: we could also help detect drift from an existing locally cached account and any new ones pulled in
   */
  if (save || saveDir) {
    if (saveDir) {
      saveDir = path.resolve(saveDir, `${address}.json`);
      createFolders(saveDir);
      command.push(`--output-file ${saveDir}`);
    } else {
      command.push(`--output-file ${address}.json`);
    }
  }

  // console.log(`Command to run:\n\n${command.join(" ")}`, "\n\n");

  //   const res = await shellExec(command.join(" "));
  //   console.log(res);
  //   return res;
  return shellExec(command.join(" "));
}

/**
 * Clone a program from a cluster and store it locally as a `.so` binary
 */
export async function cloneProgram({
  address,
  save,
  saveDir = "programs",
  url,
}: CloneProgramInput | undefined) {
  let command: string[] = [
    // comment for better diffs
    `solana program dump`,
  ];

  saveDir = path.resolve(saveDir, `${address}.so`);
  createFolders(saveDir);
  command.push(address, saveDir);

  /**
   * note: when no cluster is specified, the users `solana config` url will be used
   *
   * todo: we might want to force use a specific one or not. need to do more research/thinking on it
   */
  if (url) {
    if (url.startsWith("local")) url = "localhost";
    command.push(`--url ${url}`);
  }

  // console.log(`Command to run:\n\n${command.join(" ")}`, "\n\n");

  //   const res = await shellExec(command.join(" "));
  //   console.log(res);
  //   return res;
  return shellExec(command.join(" "));
}

/**
 * Clone all the programs listed in the config toml file
 */
export async function cloneProgramsFromConfig(
  config: SolanaToml,
  settings: CloneSettings,
  currentAccounts?: ReturnType<typeof loadFileNamesToMap>,
) {
  if (!config.clone.program) return null;

  if (!currentAccounts) {
    currentAccounts = loadFileNamesToMap(settings.saveDirFinal);
  }

  for (const key in config.clone.program) {
    if (!config.clone.program.hasOwnProperty(key)) {
      continue;
    }

    const program = config.clone.program[key];

    // todo: should we validate any of the data?

    // set the default info
    if (!program?.name) program.name = key;

    if (settings.force === true || program.clone === "always") {
      // console.log("Force refresh", token.address);
      // do nothing here so we can force the update
    } else if (settings.prompt === true || program.clone == "prompt") {
      // console.log(
      //   "Prompt the user to select to refresh or not",
      //   token.address,
      // );
      // do nothing here so we can prompt the user later
    }
    // do not clone/refresh if the account already exists and we are not force updating
    else if (currentAccounts.has(program.address)) {
      console.log("Skipping clone program:", program.address);
      continue;
    }

    await cloneProgram({
      address: program.address,
      saveDir: settings.saveDirTemp,
      // todo: what order of precedence should we use here?
      url: program.cluster || settings.url,
      // saveDir: path.resolve(saveDirTemp, "program")
    });

    // todo: handle the diff and deconflict
  }
}

/**
 * Clone all the tokens listed in the config toml file
 */
export async function cloneTokensFromConfig(
  config: SolanaToml,
  settings: CloneSettings,
  currentAccounts?: ReturnType<typeof loadFileNamesToMap>,
) {
  if (!config.clone.token) return null;

  if (!currentAccounts) {
    currentAccounts = loadFileNamesToMap(settings.saveDirFinal);
  }

  for (const key in config.clone.token) {
    if (config.clone.token.hasOwnProperty(key)) {
      const token = config.clone.token[key];
      // todo: should we validate any of the data?

      // set the default token info
      if (!token?.name) token.name = key;

      if (settings.force === true || token.clone === "always") {
        // console.log("Force refresh", token.address);
        // do nothing here so we can force the update
      } else if (settings.prompt === true || token.clone == "prompt") {
        // console.log(
        //   "Prompt the user to select to refresh or not",
        //   token.address,
        // );
        // do nothing here so we can prompt the user later
      }
      // do not clone/refresh if the account already exists and we are not force updating
      else if (currentAccounts.has(token.address)) {
        console.log("Skipping clone token:", token.address);
        continue;
      }

      /**
       * todo: we should likely check if any of the accounts are already cloned
       * - for ones that are already cloned:
       *    - default not reclone
       *    - have some options to control when to clone and when to notify the user
       *       -
       * - if they do not exist, clone them
       */

      // todo: if cloning lots of accounts, we can likely make this more efficient
      // todo: handle errors on cloning (like if the clone failed and the json file does not exist)
      await cloneAccount({
        saveDir: settings.saveDirTemp,
        address: token.address,
        // todo: what order of precedence should we use here?
        url: token.cluster || settings.url,
      });

      if (doesFileExist(settings.saveDirTemp, `${token.address}.json`)) {
        if (token.clone === "always" || settings.force == true) {
          // do nothing since we are going to force clone/refresh
        } else if (
          doesFileExist(settings.saveDirFinal, `${token.address}.json`)
        ) {
          // detect diff from any existing accounts already cloned
          const newFile = loadJsonFile<JsonAccountStruct>(
            path.resolve(settings.saveDirTemp, `${token.address}.json`),
          );
          const oldFile = loadJsonFile<JsonAccountStruct>(
            path.resolve(settings.saveDirFinal, `${token.address}.json`),
          );

          if (JSON.stringify(newFile) !== JSON.stringify(oldFile)) {
            console.warn(token.address, "already exists");

            // console.warn("The accounts are different!!");
            // todo: handle an arg flag to auto update or prompt for update

            console.log(
              "todo: prompt the user to determine if they want to clone",
            );
            continue;

            // return console.error(
            //   "The accounts are different, stopping here",
            // );
          } else {
            // console.log(token.address, "did not change");
            // delete the new file one to avoid dirtying the git history
            // unlinkSync(
            //   path.resolve(saveDirTemp, `${token.address}.json`),
            // );
          }
        }

        // safe to move to final dir
      } else console.error("Failed to clone account:", token.address);
    }
  }
}
