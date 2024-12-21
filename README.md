# Solana Node CLI

The Solana Node CLI is meant to be a generic utilitarian helper CLI to
accomplish some basic setup and troubleshooting for Solana development.

**Usage:**

```shell
npx solana --help
```

This tool is not recommended to be installed as a global npm package on your
system. If installed globally, unexpected behavior may occur.

**System Requirements:**

- NodeJS (version >= 22)

## Commands

- [`install`](#install) - Install and manage the Solana Toolkit's local
  development tooling on your system.

### install

Install the Solana Toolkit local development tooling on your system.

**Usage:**

```shell
npx solana install --help
```

The Solana Toolkit includes the following tools:

- [Rust and Cargo](https://solana.com/docs/intro/installation#install-rust) -
  The Rust program language and Cargo package manager are installed via
  [Rustup](https://rustup.rs/).
- [Agave CLI tool suite](https://solana.com/docs/intro/installation#install-the-solana-cli) -
  the standard tool suite required to build and deploy Solana programs (formerly
  known as the "Solana CLI tool suite").
- [Mucho CLI](https://github.com/solana-developers/mucho) - a superset of
  popular developer tools within the Solana ecosystem used to simplify the
  development and testing of Solana blockchain programs.
- [solana-verify](https://github.com/Ellipsis-Labs/solana-verifiable-build) - A
  command line tool to build and verify Solana programs.
- [Anchor and AVM](https://www.anchor-lang.com/docs/installation#installing-using-anchor-version-manager-avm-recommended) -
  The Anchor framework and the Anchor Version Manager (AVM)
  - Yarn is currently installed as a dependency of Anchor. This dependency is
    expected to be removed in the near future.
- [Trident Fuzzer](https://ackee.xyz/trident/docs/latest/) - Rust-based fuzzing
  framework for Solana programs to help you ship secure code.
- [Zest](https://github.com/LimeChain/zest?tab=readme-ov-file) - Code coverage
  CLI tool for Solana programs.
