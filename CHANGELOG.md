# solana

## 2.8.0-deploy.1

### Minor Changes

- added pre-deploy checks

## 2.8.0-deploy.0

### Minor Changes

- 36dfaf1: accept pass through args for the `build` command
- added deploy command

## 2.7.0

### Minor Changes

- added solana-verify to the installer
- added helper to detect and auto install debian system dependencies

## 2.6.0

### Minor Changes

- 4ebf2aa: add coverage command
- add coverage command

### Patch Changes

- 97b466a: improved installer status messages

## 2.5.0

### Minor Changes

- c86988f: add zest (code coverage tool) to the list of tools to install

### Patch Changes

- ec3fc3c: fix trident version command, allowing the trident install command to
  pass
- 2933115: improve the `install` command error messages for each tool

## 2.4.2

### Patch Changes

- fix missing beta label on "mainnet"

## 2.4.1

### Patch Changes

- added node version assertion to require users running the tool to use
  NodeJS >=22
- refactor imports to prevent circular dependencies
- refactor to use the same common option for the `--output-only` flag

## 2.4.0

### Minor Changes

- 523aa87: ability to build a single program in the workspace
- babbdb2: add build command for workspaces

## 2.3.0

### Minor Changes

- added Solana.toml support
- added account/program cloning
- added test-validator

## 2.2.1

### Patch Changes

- refactor default installing all tools

## 2.2.0

### Minor Changes

- added installer for trident

### Patch Changes

- fix install spinners and messages

## 2.1.0

### Minor Changes

- add support to install yarn

## 2.0.5

### Patch Changes

- detect missing PATH data and present a message

## 2.0.4

### Patch Changes

- fix erroneous injection of help flag

## 2.0.3

### Patch Changes

- anchor version default to same as avm

## 2.0.2

### Patch Changes

- building for node

## 2.0.1

### Patch Changes

- fix solana installer and source check

## 2.0.0

### Major Changes

- first release of this cli tool. v2 required for a specific reason
