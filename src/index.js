import path from 'path'
import pify from 'pify'
import simpleGit from 'simple-git/promise'
import rimraf from 'rimraf'
import glob from 'glob'
import * as fs from 'fs'

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
    let rawPackageJSON = fs.readFileSync(`${projectDir}/package.json`)
    let parserdPackage = JSON.parse(rawPackageJSON)
    parserdPackage.name = name
    let data = JSON.stringify(parserdPackage, null, 2)
    fs.writeFileSync(`${projectDir}/package.json`, data)
  }

  function getFiles() {
    const filesGlob = path.join(projectDir, '**', '*')
    const globOptions = {nodir: true, ignore, dot: true}
    return pify(glob)(filesGlob, globOptions)
  }
}

export default mymoCli
