/* eslint-disable no-console */

// See ../guides/next-version.md for documentation.

const path = require('path')
const semver = require('semver')
const bumpCb = require('conventional-recommended-bump')
const { promisify } = require('util')

const currentVersion = require('../package.json').version
const { releaseRules } = require('./semantic-commits/changeCategories')
const bump = promisify(bumpCb)
const paths = ['packages', 'cli']

let nextVersion

const getNextVersionForPath = async (path) => {
  // allow the semantic next version to be overridden by environment
  if (process.env.NEXT_VERSION) {
    return process.env.NEXT_VERSION
  }

  const whatBump = (foundCommits) => {
    // semantic version bump: 0 - major, 1 - minor, 2 - patch
    let level = 2
    let breakings = 0
    let features = 0

    foundCommits.forEach((commit) => {
      if (releaseRules[commit.type].release === 'major') {
        breakings += 1
        level = 0
      } else if (releaseRules[commit.type].release === 'minor') {
        features += 1
        if (level === 2) {
          level = 1
        }
      }
    })

    return {
      level,
      reason: breakings > 0
        ? `There is ${breakings} BREAKING CHANGE and ${features} features`
        : features > 0 ? `There ${features} features` : 'There are only patch changes in this release',
    }
  }

  const { releaseType } = await bump({ whatBump, path })

  return semver.inc(currentVersion, releaseType || 'patch')
}

if (require.main !== module) {
  module.exports.getNextVersionForPath = getNextVersionForPath

  return
}

(async () => {
  process.chdir(path.join(__dirname, '..'))

  for (const path of paths) {
    const pathNextVersion = await getNextVersionForPath(path)

    if (!nextVersion || semver.gt(pathNextVersion, nextVersion)) {
      nextVersion = pathNextVersion
    }
  }

  if (!nextVersion) {
    throw new Error('Unable to determine next version.')
  }

  if (process.argv.includes('--npm')) {
    const cmd = `npm --no-git-tag-version version ${nextVersion}`

    console.log(`Running '${cmd}'...`)

    return require('child_process').execSync(cmd)
  }

  console.log(nextVersion)
})()
