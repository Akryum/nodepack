# Installation

Welcome to Nodepack! To get started, install the Command-Line Interface with the instruction below.

## Requirements

Nodepack currently requires the following:

- [node.js](https://nodejs.org) 8.12 or later
- [Npm](https://docs.npmjs.com/cli-documentation/) or [Yarn](http://yarnpkg.com/)

## Command-Line Interface

Install the Command-Line Interface globally on your system. All official Nodepack packages are under the `@nodepack` scope on Npm: the CLI package is `@nodepack/cli`.

If you use Npm:

```bash
npm install -g @nodepack/cli
```

If you use Yarn:

```bash
yarn global add @nodepack/cli
```

To check if Nodepack CLI is correctly installed, run this command:

```bash
nodepack --version
```

To get help info about the CLI, use `--help`:

```bash
nodepack --help
```

## Troubleshooting

If your OS tells you `nodepack` is not foud, make sure to have the correct `PATH` environment variable setup on your computer.
It needs to contain the absolute path to Npm or Yarn bin folders where those tools put the runnable scripts from globally installed packages (like Nodepack CLI).

Check what the folder is with the following commands:

```bash
# If you use Npm
npm bin -g

# If you use Yarn
yarn global bin
```

:::tip
Most of the time, after changing the environment variables on your system, you need to re-open your terminal or your IDE for it to take effect.
:::
