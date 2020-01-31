import pify from 'pify'
import simpleGit from 'simple-git/promise'
import rimraf from 'rimraf'
import * as fs from 'fs'

function mymoCli({name, fromRepoUrl, node, clean} = {}) {
  return deletePreviouslyGeneratedFiles()
    .then(cloneRepo)
    .then(updatePackageName)

  function deletePreviouslyGeneratedFiles() {
    if (!clean) {
      return Promise.resolve()
    }
    const pRimraf = pify(rimraf)
    const opts = {disableGlob: true}
    return Promise.all([pRimraf(`./${name}`, opts)])
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
    let rawPackageJSON = fs.readFileSync(`./${name}/package.json`)
    let parserdPackage = JSON.parse(rawPackageJSON)
    parserdPackage.name = name
    let data = JSON.stringify(parserdPackage, null, 2)
    fs.writeFileSync(`./${name}/package.json`, data)
  }
}

export default mymoCli
