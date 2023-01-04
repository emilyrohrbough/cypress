const { userFacingChanges } = require('./changeCategories')
const _ = require('lodash')

function getResolvedMessage(type, prNumber, linkedIssues) {
  let resolveMessage
  if (linkedIssues.length) {
    const issueMessage = userFacingChanges[type].message.hasIssue

    const links = linkedIssues.map((issueNumber) => {
      return `[#${issueNumber}](https://github.com/cypress-io/cypress/issues/${issueNumber})`
    })

    resolveMessage = `${issueMessage} ${links.join(',')}.`
  } else {
    const prMessage = userFacingChanges[type].message.onlyPR

    resolveMessage = `${prMessage} [#${prNumber}](https://github.com/cypress-io/cypress/pulls/${prNumber}).`
  }
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
    console.log("This PR does not contain changes that impacts the next Cypress release.")
    
    if (hasChangeLogUpdate) {
      console.log("Changelog entry is not required...")
      // I want to error here...however, what if someone updated an existing entry or 
      // fixed punctuation?....
    }

    return
  }

  if (!Object.keys(userFacingChanges).includes(semanticResult.type)) {
    console.log("This PR does not contain user-facing changes that impacts the next Cypress release.")

    if (hasChangeLogUpdate) {
      console.log("Changelog entry is not required...")
      // I want to error here...however, what if someone updated an existing entry or 
      // fixed punctuation?....
    }
    return
  }

  if (!hasChangeLogUpdate) {
    throw new Error(
      `A changelog entry was not found in cli/CHANGELOG.md. Please add a changelog entry that describes the changes made in this pull request. Include this entry under the section:/\n\n${printChangeLogExample(semanticResult.type, restParameter.pull_number, linkedIssues)}`
    );
  }

  // else verify changelog message!
};
