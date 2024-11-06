import { SolanaCluster } from "@/types/config";
import { parseRpcUrlOrMoniker } from "@/lib/solana";

type DeployProgramCommandInput = {
  programId: string;
  programPath: string;
  verbose?: boolean;
  workspace?: boolean;
  manifestPath?: string;
  upgradeAuthority?: string;
  keypair?: string;
  url?: SolanaCluster | string;
};

export function buildDeployProgramCommand({
  programPath,
  programId,
  verbose = false,
  manifestPath,
  workspace = false,
  url,
  keypair,
  upgradeAuthority,
}: DeployProgramCommandInput) {
  const command: string[] = ["solana program deploy"];

  // command.push(`--output json`);

  // note: when no url/cluster is specified, the user's `solana config` url will be used
  if (url) {
    command.push(
      `--url ${parseRpcUrlOrMoniker(url, true /* enforce the "beta" label */)}`,
    );
  }

  if (keypair) {
    // todo: detect if the keypair exists?
    command.push(`--keypair ${keypair}`);
  }

  // when not set, defaults to the cli keypair
  if (upgradeAuthority) {
    // todo: detect if this file path exists?
    command.push(`--upgrade-authority ${upgradeAuthority}`);
  }

  // programId must be a file path for initial deployments
  if (programId) {
    // todo: detect if this file path exists?
    command.push(`--program-id ${programId}`);
  }

  // todo: validate the `programPath` file exists
  command.push(programPath);

  return command.join(" ");
}
