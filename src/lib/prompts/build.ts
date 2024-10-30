import { rawlist } from "@inquirer/prompts";
import { type SolanaCluster } from "@/types/config";

export async function promptToSelectCluster(
  message: string = "Select a cluster?",
  defaultValue: SolanaCluster = "mainnet",
): Promise<SolanaCluster> {
  console.log(); // print a line separator
  return rawlist<SolanaCluster>({
    message,
    theme: {
      // style: {
      // todo: we could customize the message here?
      //   error: (text) => text,
      // },
    },
    // default: "m",
    choices: [
      {
        name: "mainnet",
        key: "m",
        short: "m",
        value: "mainnet",
        // description: `Yes, clone all the accounts and programs in Solana.toml`,
      },
      {
        name: "devnet",
        short: "d",
        key: "d",
        value: "devnet",
        // description: "Do not run the 'clone' command now",
      },
      {
        name: "testnet",
        short: "t",
        key: "t",
        value: "testnet",
        // description: "Do not run the 'clone' command now",
      },
      {
        name: "localnet",
        key: "l",
        short: "l",
        value: "localnet",
        // description: "Do not run the 'clone' command now",
      },
    ],
  })
    .then(async (answer) => {
      // if (!answer) return false;

      if (answer.startsWith("m")) answer = "mainnet";

      return answer;
    })
    .catch(() => {
      /**
       * it seems that if we execute the run clone command within another command
       * (like nesting it under test-validator and prompting the user)
       * the user may not be able to exit the test-validator process via Ctrl+c
       * todo: investigate this more to see if we can still allow the command to continue
       */
      // do nothing on user cancel instead of exiting the cli
      console.log("Operation canceled.");
      process.exit();
      // todo: support selecting a default value here?
      return defaultValue;
    });
}
