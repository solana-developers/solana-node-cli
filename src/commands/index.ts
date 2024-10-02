import { Command } from "@commander-js/extra-typings";
import { getAppInfo } from "@/lib/getAppInfo.js";
import { cliOutputConfig } from "@/lib/cli";
import picocolors from "picocolors";

export default function cliProgramRoot() {
  // get app info from package.json
  const app = getAppInfo();

  // console.log(picocolors.bgMagenta(` ${app.name} - v${app.version} `));

  // initialize the cli commands and options parsing
  const program = new Command()
    .name(`npx solana`)
    .version(app.version, "--version", "output the version number of this tool")
    // .description("")
    .configureOutput(cliOutputConfig);

  return program;
}
