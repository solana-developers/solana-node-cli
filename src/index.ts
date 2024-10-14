#!/usr/bin/env node

import cliProgramRoot from "@/commands/index.js";
import installCommand from "@/commands/install";
import setupCommand from "@/commands/setup";
import { errorMessage } from "@/lib/cli";
import { Command } from "@commander-js/extra-typings";
import ora from "ora";
import { input } from "@inquirer/prompts";
import runCommand from "./commands/run";

async function main() {
  try {
    // display a spacer at the top
    // console.log();

    const program = cliProgramRoot();

    // program
    //   .command("hello")
    //   .description("Say hello")
    //   .action(async () => {
    //     const name = await input({ message: "Enter your name" });

    //     console.log(name)setupInstallCommand;

    //     // const { name } = await inquirer.prompt({
    //     //   type: "input",
    //     //   name: "name",
    //     //   message: "What is your name?",
    //     // });

    //     const spinner = ora("Processing...").start();

    //     setTimeout(() => {
    //       spinner.succeed(`Hello, ${name}!`);
    //     }, 2000);
    //   });

    // program
    //   .command("goodbye")
    //   .description("Say goodbye")
    //   .action(() => {
    //     const spinner = ora("Processing...").start();

    //     setTimeout(() => {
    //       spinner.succeed("Goodbye!");
    //     }, 2000);
    //   });

    program
      .addCommand(installCommand())
      // note: enables a shorter command for installing
      .addCommand(setupCommand())
      .addCommand(runCommand());

    // set the default action: `help` (without an error)
    if (process.argv.length === 2) {
      process.argv.push("--help");
    }

    await program.parseAsync();

    // display a spacer at the bottom
    // console.log();
  } catch (err) {
    errorMessage(err.toString());
  }
}

main();
