const core = require('@actions/core');
const github = require('@actions/github');
const validatePrTitle = require('./validatePrTitle');
const validateChangelog = require('./validateChangelog');

async function run() {
  try {
    const client = github.getOctokit(process.env.GITHUB_TOKEN);

    const contextPullRequest = github.context.payload.pull_request;
    if (!contextPullRequest) {
      throw new Error(
        "This action can only be invoked in `pull_request_target` or `pull_request` events. Otherwise the pull request can't be inferred."
      );
    }

    // The pull request info on the context isn't up to date. When
    // the user updates the title and re-runs the workflow, it would
    // be outdated. Therefore fetch the pull request via the REST API
    // to ensure we use the current title.
    const restParameters = {
      owner: contextPullRequest.base.user.login,
      repo: contextPullRequest.base.repo.name,
      pull_number: contextPullRequest.number
    }
    const { data: pullRequest } = await client.rest.pulls.get(restParameters);

    const semanticResult = await validatePrTitle({
      github: client,
      restParameters,
      prTitle: pullRequest.title,
    })

    const getIssueNumbers = (body) => {
      // remove markdown comments
      body.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, '')
    
      const references = body.match(/(close[sd]?|fix(es|ed)?|resolve[ed]?) #\d+/gi)
    
      if (!references) {
        return []
      }
    
      const issues = []
    
      references.forEach((issue) => {
        issues.push(issue.match(/\d+/)[0])
      })
    
      return _.uniq(issues)
    }

    const linkedIssues = getIssueNumbers(pullRequest.body)

    await validateChangelog({
      github: client,
      restParameters,
      semanticResult,
      linkedIssues
    })
  } catch (error) {
    core.setFailed(error.message);
  }
};

// execute main function if called from command line
if (require.main === module) {
  run()
}

module.exports = run