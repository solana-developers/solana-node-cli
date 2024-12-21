#!/usr/bin/env node

import { assertRuntimeVersion } from "@/lib/node";
import { errorMessage } from "@/lib/logs";
import cliProgramRoot from "@/commands";

import installCommand from "@/commands/install";
import doctorCommand from "@/commands/doctor";

// ensure the user running the cli tool is on a supported javascript runtime version
assertRuntimeVersion();

async function main() {
  try {
    const program = cliProgramRoot();

    program.addCommand(installCommand()).addCommand(doctorCommand());

    // set the default action to `help` without an error
    if (process.argv.length === 2) {
      process.argv.push("--help");
    }

    await program.parseAsync();
  } catch (err) {
    errorMessage(err.toString());
  }
}

main();
