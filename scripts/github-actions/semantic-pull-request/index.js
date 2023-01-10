/* eslint-disable no-console */
const { validatePrTitle } = require('./validatePrTitle')
const { validateChangelogEntry } = require('./validateChangelogEntry')
const execa = require('execa')

// Semantic Pull Request:

// PR into develop or feature branch:
//   - check PR title
//   - check for packages/cli file changes. If YES - verify changelog entry for user-facing commits
//      - an entry must be added under the correct change section
//      - an entry must include links with associated issues or a link to PR if no issues
//      - ignore changelog removals/changes even if commit doesn't match (i.e. type / grammar fix)

// PR into release branch:
//   - check PR title
//   - check for packages/cli file changes. If YES - verify changelog entry for user-facing commits
//      - an entry must be added under the correct change section
//      - an entry must include links with associated issues or a link to PR if no issues
//      - ignore changelog removals/changes even if commit doesn't match (i.e. type / grammar fix)
//

// Verifying develop branch:
//   - check each commit for packages/cli file changes. If YES - verify changelog entry for user-facing commits messages
//      - an entry must be added under the correct change section
//      - an entry must include links with associated issues or a link to PR if no issues
//      - if an commit is missing an entry, fail
//      - ignore changelog removals/changes even if commit doesn't match (i.e. type / grammar fix)
//
async function run ({ context, core, github }) {
  try {
    const contextPullRequest = context.payload.pull_request

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

    // const { stdout: currentBranch } = await execa('git', ['branch', '--show-current'])

    // console.log({ currentBranch })

    // const { stdout: commitsChangingCLI } = await execa('git', ['log', `${latestReleaseInfo.buildSha}..`, '--format="%cI %s"', '--', path.join('..', '..', '...', 'cli')])
    // const { stdout: commitsChangingPackages }  = await execa('git', ['log', `${latestReleaseInfo.buildSha}..`, '--format="%cI %s"', '--', path.join('..', '..', '...', 'packages')])

    // console.log('\n\ncommitsChangingCLI', commitsChangingCLI)
    // console.log('commitsChangingPackages',commitsChangingPackages)

    // const { stdout: changedFiles, stderr } = await execa('git', ['diff', `${process.env.GITHUB_BASE_REF}..${process.env.GITHUB_HEAD_REF}`, '--name-only'])

    // console.log('\n\nchangedFiles', changedFiles)
    // console.log('\n\nchangedFiles', stderr)

    // const { stdout: releaseReadyFiles } = await execa('git', ['diff', `${npmInfo.buildInfo.commitSha}..${process.env.GITHUB_BASE_REF}`, '--name-only'])

    // console.log('\n\releaseReadyFiles', releaseReadyFiles)

    // The pull request info on the context isn't up to date. When
    // the user updates the title and re-runs the workflow, it would
    // be outdated. Therefore fetch the pull request via the REST API
    // to ensure we use the current title.
    const restParameters = {
      owner: contextPullRequest.base.user.login,
      repo: contextPullRequest.base.repo.name,
      pull_number: contextPullRequest.number,
    }

    const { data: pullRequest } = await github.pulls.get(restParameters)

    const semanticResult = await validatePrTitle({
      github,
      restParameters,
      prTitle: pullRequest.title,
    })

    await validateChangelogEntry({
      github,
      restParameters,
      semanticResult,
      body: pullRequest.body,
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

// execute main function if called from command line
if (require.main === module) {
  run()
}

module.exports = run
