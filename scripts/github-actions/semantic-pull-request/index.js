/* eslint-disable no-console */
const { validatePrTitle } = require('./validatePrTitle')
const { validateChangelogEntry } = require('../../semantic-commits/validateChangelogEntry')

/**
 * Semantic Pull Request:
 * - check PR title
 * - check for packages/cli file changes
 *   - If YES - verify changelog entry for user-facing commits
 *      - an entry must be added under the correct change section
 *      - an entry must include links with associated issues or a link to PR if no issues
 * - ignore changelog changes even if commit doesn't include user-facing changes to allow for typo / grammar fixes
 */
async function run ({ context, core, github }) {
  try {
    const contextPullRequest = context.payload.pull_request

    if (!contextPullRequest) {
      throw new Error(
        'This action can only be invoked in `pull_request_target` or `pull_request` events. Otherwise the pull request can\'t be inferred.',
      )
    }

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

    const { data } = await github.pulls.listFiles(restParameters)

    const pullRequestFiles = data.map((fileDetails) => fileDetails.filename)

    await validateChangelogEntry({
      prNumber: contextPullRequest.number,
      pullRequestFiles,
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
