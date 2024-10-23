#!/usr/bin/env node

import { errorMessage } from "@/lib/cli";
import cliProgramRoot from "@/commands";

import installCommand from "@/commands/install";
import setupCommand from "@/commands/setup";
import cloneCommand from "@/commands/clone";
import testValidatorCommand from "@/commands/test-validator";

async function main() {
  try {
    const program = cliProgramRoot();

    program
      .addCommand(installCommand())
      // note: enables a shorter command for installing
      .addCommand(setupCommand())
      .addCommand(cloneCommand())
      .addCommand(testValidatorCommand());

    // set the default action to `help` (without an error)
    if (process.argv.length === 2) {
      process.argv.push("--help");
    }

    await program.parseAsync();
  } catch (err) {
    errorMessage(err.toString());
  }
}

main();
