/* eslint-disable no-console */
const { userFacingChanges } = require('./changeCategories')
const fs = require('fs')
const path = require('path')

function _getResolvedMessage (type, prNumber, linkedIssues) {
  if (linkedIssues?.length) {
    const issueMessage = userFacingChanges[type].message.hasIssue

    const links = linkedIssues.sort((a, b) => a - b)
    .map((issueNumber) => {
      return `[#${issueNumber}](https://github.com/cypress-io/cypress/issues/${issueNumber})`
    })

    // one issue: [#num]
    // two issues: [#num] and [#num]
    // two+ issues: [#num], [#num] and [#num]
    const linkMessage = [links.slice(0, -1).join(', '), links.slice(-1)[0]].join(links.length < 2 ? '' : ' and ')

    return `${issueMessage} ${linkMessage}.`
  }

  const prMessage = userFacingChanges[type].message.onlyPR

  return `${prMessage} [#${prNumber}](https://github.com/cypress-io/cypress/pull/${prNumber}).`
}

const _getIssueNumbers = (body = '') => {
  // remove markdown comments
  body.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, '')

  const references = body.match(/(close[sd]?|fix(es|ed)?|resolve[s|d]?) (cypress-io\/cypress)?#\d+/gi)

  if (!references) {
    return []
  }

  const issues = []

  references.forEach((issue) => {
    issues.push(issue.match(/\d+/)[0])
  })

  return issues.filter((v, i, a) => a.indexOf(v) === i)
}

function printChangeLogExample (type, prNumber, linkedIssues) {
  const resolveMessage = _getResolvedMessage(type, prNumber, linkedIssues)

  return `${userFacingChanges[type].section}\n - <Insert change details>. ${resolveMessage}`
}

async function validateChangelogEntry ({ github, restParameters, semanticResult, body }) {
  // gh pr view https://github.com/emilyrohrbough/cypress/pull/4 --json files
  const { data } = await github.pulls.listFiles(restParameters)

  // console.log('current branch', process.env.GITHUB_HEAD_REF)
  // console.log('base branch', process.env.GITHUB_BASE_REF)

  const pullRequestFiles = data.map((fileDetails) => {
    return fileDetails.filename
  })

  const hasChangeLogUpdate = pullRequestFiles.includes('cli/CHANGELOG.md')
  const binaryFiles = pullRequestFiles.filter((filename) => {
    return /^(cli|packages)/.test(filename) && filename !== 'cli/CHANGELOG.md'
  })

  if (binaryFiles.length === 0) {
    console.log('This pull request does not contain changes that impacts the next Cypress release.')

    if (hasChangeLogUpdate) {
      console.log('Changelog entry is not required...')
      // I want to error here...however, what if someone updated an existing entry or
      // fixed punctuation?....
    }

    return
  }

  if (!Object.keys(userFacingChanges).includes(semanticResult.type)) {
    console.log('This pull request does not contain user-facing changes that impacts the next Cypress release.')

    if (hasChangeLogUpdate) {
      console.log('Changelog entry is not required...')
      // I want to error here...however, what if someone updated an existing entry or
      // fixed punctuation?....
    }

    return
  }

  const linkedIssues = _getIssueNumbers(body)

  if (!hasChangeLogUpdate) {
    throw new Error(
      `A changelog entry was not found in cli/CHANGELOG.md. Please add a changelog entry that describes the changes made in this pull request. Include this entry under the section:/\n\n${printChangeLogExample(semanticResult.type, restParameters.pull_number, linkedIssues)}`,
    )
  }

  const changelog = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'cli', 'CHANGELOG.md'), 'utf8')

  // const additions = hasChangeLogUpdate.patch.split('\n').filter(p => p.startsWith('+')).map(p => p.replace('+', '')).join('\n')

  // const nextVersion = await getNextVersionForPath()

  // if (!changelog.includes(`## ${nextVersion}`)) {
  //   throw new Error(`The changelog version does not contain the next Cypress version of ${nextVersion}. If the changelog version is correct, please correct the pull request title to correctly reflect the change being made.`)
  // }

  if (!changelog.includes(userFacingChanges[semanticResult.type].section)) {
    throw new Error(`The changelog does not include the ${userFacingChanges[semanticResult.type].section} section. Given the pull request title provided, this section should be included in the changelog. If the changelog section is correct, please correct the pull request title to correctly reflect the change being made.`)
  }

  const resolveMessage = _getResolvedMessage(semanticResult.type, restParameters.pull_number, linkedIssues)

  if (!changelog.includes(resolveMessage)) {
    if (linkedIssues?.length) {
      throw new Error(`The changelog entry does not include the linked issues that this pull request resolves. Please update your entry to include:\n\n${resolveMessage}`)
    }

    throw new Error(`The changelog entry does not include the pull request link. Please update your entry to include:\n\n${resolveMessage}`)
  }

  console.log('It appears at a high-level your changelog entry is correct! The remaining validation is left to the pull request reviewers.')
}

module.exports = {
  validateChangelogEntry,
  _getIssueNumbers,
  _getResolvedMessage,
}
