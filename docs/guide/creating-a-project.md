# Creating a project

Let's create our first Nodepack project!

## Create command

To create a new `my-app` project, use this command:

```bash
nodepack create my-app
```

You will be prompted to choose a [Preset](./preset.md) or to manually select features. If you go with the second route, you will prompted several option to customize the bootstraping of your project. When you will be done, you will be able to save your whole selection into a new Preset.

Each project will necessarily contain the Nodepack [Service](./service.md) in the dependencies.

## Project content

Let's take a look at how a Nodepack projectcan look like. Note that some folders or files may not be present for your system or may be created automatically as needed by Nodepack.

A newly created project with the default [preset](./preset.md) will contain the following files and folders:

```bash
📁 .nodepack             # Special folder for internal Nodepack work
📁 config                # (Optional) You can write configurations here
📁 dist                  # Built files after compilation
📁 node_modules          # Installed npm packages from dependencies
📁 src                   # Project source code
📄 .gitignore            # Ignore Rules for Git
📄 nodepack.config.js    # Nodepack configuration file
📄 package.json          # JS project configuration file
📄 README.md             # Auto-generated ReadMe text
```

### 📁 config

This folder can contain configurations for your project, typically like the database connection information. See [Configuration](./config.md) for more details.

### 📁 dist

Initially, you shouldn't have this folder until you [build](./service.md#production-build) the project. It will contain all the compiled files you can put on a production server. It should **not** be added to source control like Git.

### 📁 node_modules

This folder contains the installed dependencies required by your project -- don't edit it directly! It should **not** be added to source control like Git.

### 📁 src

In this folder, you will write the source code of your project.

### 📄 nodepack.config.js

In the root directory of the project, the `nodepack.config.js` file allows you to configure Nodepack to adapt to your use case. See the [Configuration Reference](../config/) for more information.

### 📄 package.json

Where the JavaScript project and its dependencies are described.

### 📄 README.md

It's a markdown file where you can write useful notes about the project. For example: description, installation instructions, etc.

### 📁 .nodepack

Nodepack projects contain a special `.nodepack` folder (which may be hidden in your file explorer). Files in this folder are required for Nodepack to work properly. **⚠️ Edit the folder content at your own risk!**

Here are what those files do:

```bash
📁 temp                                # Project source code
📄 .gitignore                          # Some files in .nodepack will be ignored by git
📄 app-migration-plugin-versions.json  # Plugin versions of last app migrations
📄 app-migration-records.json          # Applied app migrations are saved here
📄 config.json                         # Configuration for internals
📄 env-migration-records.json          # Applied env migrations are saved here
📄 README.md                           # Explanation notice
```

::: warning
Don't exclude this folder from your version control. You should commit changes made by Nodepack to this folder!
:::

### 📄 .gitignore

By default, your project will contain this file which make Git ignore some folders and files. Learn more about [gitignore](https://git-scm.com/docs/gitignore).

## Git repository

By default, Nodepack will attempt to create a Git repository for your new project. This will help you keep track of the modifications made to your project by [plugins](./plugins.md).

You can customize the commit message like this:

```bash
nodepack create my-app --git "creating a new app"
```

You can also opt out of this git initialization entirely with the `--no-git` flag:

```bash
nodepack create my-app --no-git
```

## Working in a team

Nodepack was designed with Team work in mind. After you host your project on a server for example, your other team members will be able to get started with those simple steps:

**Step 1:** [Install](./installation.md) Nodepack on their computer.

**Step 2:** Clone your project repository:

```bash
git clone git@github.com:my-company/my-project.git
```

**Step 3:** Move into the project folder:

```bash
cd my-project
```

**Step 4:** Run `nodepack`:

```bash
nodepack
```

What will happen next:

- Nodepack will automatically install the dependencies on their computer.
- It will then run the [service](./service.md) in development mode.
- This means the [maintenance](./maintenance.md) will be run.
- The user environment will automatically migrated (for example, its Database installed, created and seeded).
- The project will compile and run in development mode.
