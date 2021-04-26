# Mymo-cli

A tool to generate things for Mymoid.

## The problem

Managing services repositories. We want to create many services in mymoid, with
many setups, dependencies ... The problem is keeping updated the stack to create
new services from a scaffold project.

## This solution

This allows you to generate a new service from a scaffold node or java.

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```
npm install -g mymo-cli
```

## Usage

### CLI

This module is a CLI. The good place for it is in your npm scripts.

```javascript
{
  "scripts": {
    "generate": "mymo-cli generate"
  }
}
```

#### generate

This is currently the only available command. Below is a list of the available
options (which are parsed with the amazing
[yargs](https://github.com/yargs/yargs)):

##### `--name` (required)

The name of the service. This is the directory where `mymoid-cli` clone the
scaffold project. `mymoid-cli` create the npm package for you.

##### `--orm` (optional)

Posible values are: **postgress** or **mongo**. This options create a typeorm integration. 

##### `--msw` (optional)

For external service integration.

##### `--entityName` (optional)

Defaults to `Entity` Replace entity name.

##### `--from-repo-url`

Defaults to mymoid pivate repository called `mymoidapis-node-scaffold`. This is
where `myomid-cli` will look for your scaffold project. Whatever you provide
will be resolved as relative to where you're executing the command
(`process.cwd`).
