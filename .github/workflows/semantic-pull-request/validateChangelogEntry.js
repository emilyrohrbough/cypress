const { userFacingChanges } = require('./changeCategories')
const _ = require('lodash')

function getResolvedMessage(type, prNumber, linkedIssues) {
  if (linkedIssues.length) {
    const issueMessage = userFacingChanges[type].message.hasIssue

    const links = linkedIssues.map((issueNumber) => {
      return `[#${issueNumber}](https://github.com/cypress-io/cypress/issues/${issueNumber})`
    })

    return `${issueMessage} ${links.join(',')}.`
  }

  const prMessage = userFacingChanges[type].message.onlyPR

  return `${prMessage} [#${prNumber}](https://github.com/cypress-io/cypress/pulls/${prNumber}).`
}

function printChangeLogExample(type, prNumber, linkedIssues) {
  const resolveMessage = getResolvedMessage(type, prNumber, linkedIssues)

  return `${userFacingChanges[type].section}\n - <Insert change details>. ${resolveMessage}`
}

module.exports = async function validateChangelogEntry({ github, restParameters, semanticResult, linkedIssues }) {
  // gh pr view https://github.com/emilyrohrbough/cypress/pull/4 --json files
  const { data } = await github.rest.pulls.listFiles(restParameters);
  
  const pullRequestFiles = data.map((fileDetails) => {
    console.log(fileDetails)
    return fileDetails.filename
  })
  
  const binaryFiles = pullRequestFiles.filter((filename) => {
    return /^(cli|packages)/.test(filename)
  })

  const hasChangeLogUpdate = pullRequestFiles.includes('cli/CHANGELOG.md')

  if (binaryFiles.length === 0) {
    console.log("This pull request does not contain changes that impacts the next Cypress release.")
    
    if (hasChangeLogUpdate) {
      console.log("Changelog entry is not required...")
      // I want to error here...however, what if someone updated an existing entry or 
      // fixed punctuation?....
    }

    return
  }

  if (!Object.keys(userFacingChanges).includes(semanticResult.type)) {
    console.log("This pull request does not contain user-facing changes that impacts the next Cypress release.")

    if (hasChangeLogUpdate) {
      console.log("Changelog entry is not required...")
      // I want to error here...however, what if someone updated an existing entry or 
      // fixed punctuation?....
    }
    return
  }

  if (!hasChangeLogUpdate) {
    throw new Error(
      `A changelog entry was not found in cli/CHANGELOG.md. Please add a changelog entry that describes the changes made in this pull request. Include this entry under the section:/\n\n${printChangeLogExample(semanticResult.type, restParameters.pull_number, linkedIssues)}`
    );
  }

  const changelog = fs.readFileSync(dirname, '..', '..', 'cli', 'CHANGELOG.md')
  // const nextVersion = await getNextVersionForPath()

  // if (!changelog.includes(`## ${nextVersion}`)) {
  //   throw new Error(`The changelog version does not contain the next Cypress version of ${nextVersion}. If the changelog version is correct, please correct the pull request title to correctly reflect the change being made.`)
  // }

  const sections = changelog.split(/**[a-zA-Z]+:**/)
  if (!sections.includes(userFacingChanges[semanticResult.type].section)) {
    throw new Error(`The changelog does not include the ${userFacingChanges[semanticResult.type].section} section. Given the pull request title provided, this section should be included in the changelog. If the changelog section is correct, please correct the pull request title to correctly reflect the change being made.`)
  }

  const resolveMessage = getResolvedMessage(semanticResult.type, restParameters.pull_number, linkedIssues)
  if (!sections.includes(resolveMessage)) {
    if (linkedIssues.length) {
      throw new Error(`The changelog entry does not include the linked issues that this pull request resolves. Please update your entry to include:\n\n${resolveMessage}`)
    }

    throw new Error(`The changelog entry does not include the pull request link. Please update your entry to include:\n\n${resolveMessage}`)
  }

  console.log('It appears at a high-level your changelog entry is correct! the remaining validation is left to the pull request reviewers.')
};
