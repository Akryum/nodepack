# Preset

A preset is a collection of plugins to quickly create new projects. When you create a project manually, you can save your selection into a preset that you or others can reuse later. You can find the saved presets in the `<your home>/.nodepackrc` file.

## Preset file

Here is an example preset in a JSON file:

```json
{
  "name": "Typescript + TSLint",
  "useConfigFiles": true,
  "plugins": {
    "@nodepack/plugin-babel": "^0.0.1",
    "@nodepack/plugin-typescript": "^0.0.1"
  },
  "appMigrations": {
    "@nodepack/plugin-typescript": {
      "default-template@0.0.1": {
        "tslint": true
      }
    }
  }
}
```

The `useConfigFiles` indicates if the configurations needs to be extracted into individual files instead of living in the project `package.json` file.

The preset will install the Nodepack [plugins](./plugins.md) listed in the `plugins` object while respecting the version range listed. If you don't want to force a version range, put an empty string.

### App migrations

When creating the project and installing the plugins, Nodepack will run the standard [maintenance](./maintenance.md) which means it will apply [app migrations](./app-migrations.md).

App migrations are programs that allow the plugin to install new dependencies and modify the source code of your project.

App migrations can prompt the user for additional customization, but you can also pre-defined the answers in the preset like done in the example.

```json
{
"appMigrations": {
    "@nodepack/plugin-typescript": {
      "default-template@0.0.1": {
        "tslint": true
      }
    }
  }
}
```

The first keys in the `appMigrations` object are the names of the Nodepack [plugins](./plugins.md). Then, the child keys are the ids of the [app migrations](./app-migrations.md).

Here we pre-define the `tslint` answer to the `default-template@0.0.1` app migration from the `@nodepack/plugin-typescript` plugin.

:::tip
One plugin can register many different app migrations.
:::

## Local usage

You can use this preset file when creating a project like this:

```bash
nodepack create my-app --preset ./my-preset.json
```

You can also create a folder and put the preset JSON into a `preset.json` file at the root. In this example, Nodepack will try to load the `./some-folder/preset.json` file:

```bash
nodepack create my-app --preset ./some-folder
```

## Remote usage

A preset can be hosted on a Git repositry. Make sure it contains the `preset.json` file at the root. Then, any one having access to this repository can use it to create a new project.

If you use GitHub:

```bash
nodepack create my-app --preset owner/name
```

If you use GitLab:

```bash
nodepack create my-app --preset gitlab:owner/name
```

If you use Bitbucket:

```bash
nodepack create my-app --preset bitbucket:owner/name
```

If the repository is private, you need to pass `--clone`:

```bash
nodepack create my-app --preset owner/name --clone
```

By default, the `master` branch will be used, but you can specify another one with a URL fragment:

```bash
nodepack create my-app --preset owner/name#my-branch
```

You can also specify a custom origin:

```bash
nodepack create my-app --preset gitlab:custom.com:owner/name
```

If you are not on a popular hosted Git platform, you can use the `direct:` tag with the full URL to the ZIP file:

```bash
nodepack create my-app --preset direct:https://foobar.com/repository/master.zip
```

Or if you can clone it using the URL to the Git repository:

```bash
nodepack create my-app --preset direct:https://foobar.com/repository.git#my-branch
```
