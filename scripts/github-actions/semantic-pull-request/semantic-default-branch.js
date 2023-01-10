/* eslint-disable no-console */
const execa = require('execa')
const path = require('path')

// const { validateChangelogEntry } = require('./validateChangelogEntry')

async function run ({ context, core, github }) {
  try {
    const contextPullRequest = context.payload.branch

    if (!contextPullRequest) {
      throw new Error(
        'This action can only be invoked in `pull_request_target` or `pull_request` events. Otherwise the pull request can\'t be inferred.',
      )
    }

    console.log('Get Current Release Information\n')
    const { stdout } = await execa('npm', ['info', 'cypress', '--json'])
    const npmInfo = JSON.parse(stdout)

    const latestReleaseInfo = {
      version: npmInfo['dist-tags'].latest,
      commitDate: npmInfo.buildInfo.commitDate,
      buildSha: npmInfo.buildInfo.commitSha,
    }

    console.log(latestReleaseInfo)

    const { stdout: currentBranch } = await execa('git', ['branch', '--show-current'])

    console.log({ currentBranch })

    const { stdout: commitsChangingCLI } = await execa('git', ['log', `${latestReleaseInfo.buildSha}..`, '--format="%cI %s"', '--', path.join('..', '..', '..', 'cli')])
    const { stdout: commitsChangingPackages } = await execa('git', ['log', `${latestReleaseInfo.buildSha}..`, '--format="%cI %s"', '--', path.join('..', '..', '..', 'packages')])

    console.log('\n\ncommitsChangingCLI', commitsChangingCLI)
    console.log('commitsChangingPackages', commitsChangingPackages)

    const { stdout: releaseReadyFiles } = await execa('git', ['diff', `${npmInfo.buildInfo.commitSha}..${process.env.GITHUB_REF}`, '--name-only'])

    console.log('\n\releaseReadyFiles', releaseReadyFiles)

    // const restParameters = {
    //   owner: 'cypress-io',
    //   repo: 'cypress',
    // }

    // const { data: pullRequest } = await github.pulls.get(restParameters)

    // await validateChangelogEntry({
    //   github,
    //   restParameters,
    //   semanticResult,
    //   body: pullRequest.body,
    // })
  } catch (error) {
    core.setFailed(error.message)
  }
}

// execute main function if called from command line
if (require.main === module) {
  run()
}

module.exports = run
