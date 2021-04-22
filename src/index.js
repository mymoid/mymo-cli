import * as fs from 'fs'
import path from 'path'
import pify from 'pify'
import simpleGit from 'simple-git/promise'
import rimraf from 'rimraf'
import pLimit from 'p-limit'
import mkdirp from 'mkdirp'
import glob from 'glob'
import {getErrorLogger} from './utils'

// We need to escape \ when used with constructor
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
const CommentStartTpl = '(?:\\/\\/\\s|\\/\\*\\s?|<!--\\s?)'
const CommentEndTpl = '.*?\\n'

const getRegEx = entity =>
  ` *?${CommentStartTpl}${entity}_START${CommentEndTpl}((.|\n|\r)*?) *${CommentStartTpl}${entity}_END${CommentEndTpl}`

const REGEX = {
  orm: new RegExp(getRegEx('ORM'), 'g'),
  postgres: new RegExp(getRegEx('POSTGRES'), 'g'),
  mongo: new RegExp(getRegEx('MONGO'), 'g'),
  comment: new RegExp(getRegEx('COMMENT'), 'g'),
}
const ORM_CONTENT = {
  postgres: () => true,
  mongo: () => true,
}
const openFileLimit = pLimit(100)

function mymoCli({
  name,
  fromRepoUrl,
  node,
  orm,
  clean,
  ignore = [`${name}/.git/**/*`],
} = {}) {
  const projectDir = `./${name}`
  const projectCloneTmpName = 'clone-tmp'
  const projectCloneTmpDir = `./${projectCloneTmpName}`
  return deletePreviouslyGeneratedFiles()
    .then(cloneRepo)
    .then(updatePackageName)
    .then(getFiles)
    .then(readAllFilesAsPromise)
    .then(createNewOrmFiles)
    .then(saveFiles)
    .then(deleteCloneTmpRepo)

  function deletePreviouslyGeneratedFiles() {
    if (!clean) {
      return Promise.resolve()
    }
    const pRimraf = pify(rimraf)
    const opts = {disableGlob: true}
    return Promise.all([pRimraf(projectDir, opts)])
  }

  function deleteCloneTmpRepo() {
    const pRimraf = pify(rimraf)
    const opts = {disableGlob: true}
    return Promise.all([pRimraf(projectCloneTmpDir, opts)])
  }

  function cloneRepo() {
    return simpleGit()
      .silent(true)
      .clone(fromRepoUrl, projectCloneTmpName)
  }

  function updatePackageName() {
    if (!node) {
      return Promise.resolve()
    }
    const rawPackageJSON = fs.readFileSync(`${projectCloneTmpDir}/package.json`)
    const parsedPackage = JSON.parse(rawPackageJSON)
    Object.assign(parsedPackage, {name})
    const data = JSON.stringify(parsedPackage, null, 2)
    fs.writeFileSync(`${projectCloneTmpDir}/package.json`, data)
    return Promise.resolve()
  }

  function getFiles() {
    const filesGlob = path.join(projectCloneTmpDir, '**', '*')
    const globOptions = {nodir: true, ignore, dot: true}
    return pify(glob)(filesGlob, globOptions)
  }

  function readFileAsPromise(file) {
    return pify(fs.readFile)(file, 'utf8').then(contents => ({file, contents}))
  }

  function readAllFilesAsPromise(files) {
    const allPromises = files.map(file =>
      openFileLimit(() => readFileAsPromise(file)),
    )
    return Promise.all(allPromises)
  }

  // eslint-disable-next-line consistent-return
  function createNewOrmFiles(fileObjs) {
    if (!orm) {
      return fileObjs.map(fileObj => {
        return Object.assign(
          {
            ormContents: removeOrmContents(fileObj.contents),
          },
          fileObj,
        )
      })
    }
    if (orm === 'postgres') {
      return fileObjs.map(fileObj => {
        return Object.assign(
          {
            postgresContents: createPostgresContents(fileObj.contents),
          },
          fileObj,
        )
      })
    }
    if (orm === 'mongo') {
      return fileObjs.map(fileObj => {
        return Object.assign(
          {
            mongoContents: createMongoContents(fileObj.contents),
          },
          fileObj,
        )
      })
    }
  }

  function removeOrmContents(contents) {
    return contents
      .replace(REGEX.orm, '')
      .replace(REGEX.postgres, '')
      .replace(REGEX.mongo, '')
      .replace(REGEX.comment, '')
  }

  function createPostgresContents(contents) {
    return contents
      .replace(REGEX.orm, '$1')
      .replace(REGEX.postgres, '$1')
      .replace(REGEX.mongo, '')
      .replace(REGEX.comment, '')
  }

  function createMongoContents(contents) {
    return contents
      .replace(REGEX.orm, '$1')
      .replace(REGEX.mongo, '$1')
      .replace(REGEX.postgres, '')
      .replace(REGEX.comment, '')
  }

  function saveFiles(fileObjs) {
    const allPromises = fileObjs.reduce((all, fileObj) => {
      return [...all, ...saveOrm(fileObj)]
    }, [])
    return Promise.all(allPromises)
  }

  function saveOrm({file, ormContents, postgresContents, mongoContents}) {
    const relativeDestination = path.relative(projectCloneTmpDir, file)
    const projectDestination = path.resolve(projectDir, relativeDestination)
    return [
      ormContents
        ? openFileLimit(() => saveFile(projectDestination, ormContents))
        : null,
      postgresContents
        ? openFileLimit(() => saveFile(projectDestination, postgresContents))
        : null,
      mongoContents
        ? openFileLimit(() => saveFile(projectDestination, mongoContents))
        : null,
    ].filter(Boolean) // filter out the files that weren't saved
  }

  function saveFile(file, contents) {
    return pify(mkdirp)(path.dirname(file), {}).then(() => {
      return pify(fs.writeFile)(file, contents).then(() => file)
    }, getErrorLogger(`mkdirp(${path.dirname(file)})`))
  }
}

export default mymoCli
