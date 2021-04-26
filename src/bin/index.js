#!/usr/bin/env node
import yargs from 'yargs'
import chalk from 'chalk'
import {oneLine} from 'common-tags'
import mymoCli from '../index'

yargs
  .usage('Usage: $0')
  .command(
    'generate',
    'generate your service',
    {
      name: {
        description: 'Service name',
        requiresArg: true,
      },
      fromRepoUrl: {
        description: 'Git url scaffold repo to generate from',
        default:
          'https://github.com/technoactivity/mymoidapis-node-scaffold.git',
      },
      node: {
        description: 'Scaffold in node',
        type: 'boolean',
        default: true,
      },
      orm: {
        description: oneLine`
        Orm/odm integration wht you want
      `,
        choices: ['postgres', 'mongo'],
      },
      entityName: {
        description: 'If orm, create an Entity',
          default: 'Entity'
      },
      msw: {
        description: 'If you want a msw dev flow',
        type: 'boolean',
        defaut: false,
      },
      clean: {
        description: oneLine`
        Deletes the exercises and
        exercises-final to keep your space clean
      `,
        default: true,
        type: 'boolean',
      },
      ignore: {
        description: 'Globs you would like to ignore',
        type: 'array',
      },
      silentSuccess: {
        description: 'Whether to log success',
        type: 'boolean',
      },
      silentAll: {
        description: 'Whether to log at all',
        type: 'boolean',
      },
    },
    generate,
  )
  .help('h')
  .alias('h', 'help').argv

function generate(options) {
  return mymoCli(options).then(
    savedFiles => {
      if (!options.silentSuccess && !options.silentAll) {
        const count = savedFiles.length
        const files = `file${count === 1 ? '' : 's'}`
        const colon = `${count === 0 ? '' : ':'}`
        process.stdout.write(
          `
${chalk.reset.green(`Saved ${count} ${files}${colon}`)}
${savedFiles.join('\n')}
          `.trim(),
        )
      }
      return savedFiles
    },
    error => {
      if (!options.silentAll) {
        process.stderr.write(error.toString())
      }
      return Promise.reject(error)
    },
  )
}
