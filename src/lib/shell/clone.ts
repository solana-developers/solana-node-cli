import path from "path";
import shellExec from "shell-exec";
import {
  createFolders,
  doesFileExist,
  loadFileNamesToMap,
  loadJsonFile,
} from "../utils";
import { CloneSettings, SolanaCluster, SolanaToml } from "@/types/config";
import { parseRpcUrlOrMoniker } from "../solana";
import {
  DEFAULT_ACCOUNTS_DIR,
  DEFAULT_ACCOUNTS_DIR_TEMP,
} from "@/const/solana";
import { warnMessage } from "../cli";

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
  saveDir = DEFAULT_ACCOUNTS_DIR,
  url,
}: CloneAccountInput | undefined) {
  let command: string[] = [
    // comment for better diffs
    `solana account ${address}`,
    "--output json",
    // todo: enable this for production, maybe handled with a verbose mode or something?
    // "--output json-compact",
  ];

  // note: when no url/cluster is specified, the user's `solana config` url will be used
  if (url) {
    command.push(`--url ${parseRpcUrlOrMoniker(url)}`);
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

  // note: when no url/cluster is specified, the user's `solana config` url will be used
  if (url) {
    command.push(`--url ${parseRpcUrlOrMoniker(url)}`);
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
  currentAccounts: ReturnType<typeof loadFileNamesToMap>,
) {
  if (!config?.clone?.program) return null;

  for (const key in config.clone.program) {
    if (!config.clone.program.hasOwnProperty(key)) {
      continue;
    }

    const program = config.clone.program[key];

    // todo: should we validate any of the data?

    // set the default info
    if (!program?.name) program.name = key;

    if (program.clone === "always") {
      console.log("Always clone program:", program.address);
    } else if (settings.force === true) {
      console.log("Force clone program:", program.address);
    } else if (currentAccounts.has(program.address)) {
      console.log("Skipping clone program:", program.address);
      continue;
    } else {
      console.log("Clone program:", program.address);
    }

    await cloneProgram({
      address: program.address,
      saveDir: DEFAULT_ACCOUNTS_DIR_TEMP,
      url: program.cluster || config.settings.cluster,
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
  currentAccounts: ReturnType<typeof loadFileNamesToMap>,
) {
  if (!config?.clone?.token) return null;

  for (const key in config.clone.token) {
    if (!config.clone.token.hasOwnProperty(key)) {
      continue;
    }

    const token = config.clone.token[key];
    // todo: should we validate any of the data?

    // set the default token info
    if (!token?.name) token.name = key;

    if (token.clone === "always") {
      console.log("Always clone token:", token.address);
    } else if (settings.force === true) {
      console.log("Force clone token:", token.address);
    } else if (currentAccounts.has(token.address)) {
      console.log("Skipping clone token:", token.address);
      continue;
    } else {
      console.log("Clone token:", token.address);
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
      saveDir: DEFAULT_ACCOUNTS_DIR_TEMP,
      address: token.address,
      url: token.cluster || config.settings.cluster,
    });

    if (
      !doesFileExist(
        path.join(DEFAULT_ACCOUNTS_DIR_TEMP, `${token.address}.json`),
      )
    ) {
      console.error("Failed to clone token:", token.address);
      continue;
    }

    /**
     * todo: we should ensure the cloned account's `owner` program is auto cloned
     * - from the same network as the token
     * - not to override any manually defined configs settings
     */

    if (token.clone === "always" || settings.force == true) {
      // do nothing since we are going to force clone/refresh
    } else if (
      doesFileExist(
        path.join(config.settings.accountDir, `${token.address}.json`),
      )
    ) {
      // detect diff from any existing accounts already cloned
      const newFile = loadJsonFile<JsonAccountStruct>(
        path.resolve(DEFAULT_ACCOUNTS_DIR_TEMP, `${token.address}.json`),
      );
      const oldFile = loadJsonFile<JsonAccountStruct>(
        path.resolve(config.settings.accountDir, `${token.address}.json`),
      );

      if (JSON.stringify(newFile) !== JSON.stringify(oldFile)) {
        warnMessage(`${token.address} already exists`);

        // warnMessage("The accounts are different!!");
        // todo: handle an arg flag to auto update or prompt for update

        console.log("todo: prompt the user to determine if they want to clone");
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
  }
}

/**
 * Clone all the accounts listed in the config toml file
 */
export async function cloneAccountsFromConfig(
  config: SolanaToml,
  settings: CloneSettings,
  currentAccounts: ReturnType<typeof loadFileNamesToMap>,
) {
  if (!config?.clone?.account) return null;

  for (const key in config.clone.account) {
    if (!config.clone.account.hasOwnProperty(key)) {
      continue;
    }

    const account = config.clone.account[key];
    // todo: should we validate any of the data?

    // set the default account info
    if (!account?.name) account.name = key;

    if (account.clone === "always") {
      console.log("Always clone account:", account.address);
    } else if (settings.force === true) {
      console.log("Force clone account:", account.address);
    } else if (currentAccounts.has(account.address)) {
      console.log("Skipping clone account:", account.address);
      continue;
    } else {
      console.log("Clone account:", account.address);
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
      saveDir: DEFAULT_ACCOUNTS_DIR_TEMP,
      address: account.address,
      url: account.cluster || config.settings.cluster,
    });

    if (
      !doesFileExist(
        path.join(DEFAULT_ACCOUNTS_DIR_TEMP, `${account.address}.json`),
      )
    ) {
      console.error("Failed to clone token:", account.address);
      continue;
    }

    /**
     * todo: we should ensure the cloned account's `owner` program is auto cloned
     * - from the same network as the account
     * - not to override any manually defined configs settings
     */

    if (account.clone === "always" || settings.force == true) {
      // do nothing since we are going to force clone/refresh
    } else if (
      doesFileExist(
        path.join(config.settings.accountDir, `${account.address}.json`),
      )
    ) {
      // detect diff from any existing accounts already cloned
      const newFile = loadJsonFile<JsonAccountStruct>(
        path.resolve(DEFAULT_ACCOUNTS_DIR_TEMP, `${account.address}.json`),
      );
      const oldFile = loadJsonFile<JsonAccountStruct>(
        path.resolve(config.settings.accountDir, `${account.address}.json`),
      );

      if (JSON.stringify(newFile) !== JSON.stringify(oldFile)) {
        warnMessage(`${account.address} already exists`);

        // warnMessage("The accounts are different!!");
        // todo: handle an arg flag to auto update or prompt for update

        console.log("todo: prompt the user to determine if they want to clone");
        continue;

        // return console.error(
        //   "The accounts are different, stopping here",
        // );
      } else {
        // console.log(account.address, "did not change");
        // delete the new file one to avoid dirtying the git history
        // unlinkSync(
        //   path.resolve(saveDirTemp, `${account.address}.json`),
        // );
      }
    }
  }
}
