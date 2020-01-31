import * as fs from 'fs'
import path from 'path'
import pify from 'pify'
import simpleGit from 'simple-git/promise'
import rimraf from 'rimraf'
import glob from 'glob'

function mymoCli({
  name,
  fromRepoUrl,
  node,
  clean,
  ignore = [`${name}/.git/**/*`],
} = {}) {
  const projectDir = `./${name}`
  return deletePreviouslyGeneratedFiles()
    .then(cloneRepo)
    .then(updatePackageName)
    .then(getFiles)

  function deletePreviouslyGeneratedFiles() {
    if (!clean) {
      return Promise.resolve()
    }
    const pRimraf = pify(rimraf)
    const opts = {disableGlob: true}
    return Promise.all([pRimraf(projectDir, opts)])
  }

  function cloneRepo() {
    return simpleGit()
      .silent(true)
      .clone(fromRepoUrl, name)
  }

  function updatePackageName() {
    if (!node) {
      return Promise.resolve()
    }
    const rawPackageJSON = fs.readFileSync(`${projectDir}/package.json`)
    const parsedPackage = JSON.parse(rawPackageJSON)
    Object.assign(parsedPackage, {name})
    const data = JSON.stringify(parsedPackage, null, 2)
    fs.writeFileSync(`${projectDir}/package.json`, data)
    return Promise.resolve()
  }

  function getFiles() {
    const filesGlob = path.join(projectDir, '**', '*')
    const globOptions = {nodir: true, ignore, dot: true}
    return pify(glob)(filesGlob, globOptions)
  }
}

export default mymoCli
