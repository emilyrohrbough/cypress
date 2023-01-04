const changeLinkPhrases = {
  default: {
    hasIssue: 'Addresses',
    onlyPR: 'Addressed in',
  },
  fix: {
    hasIssue: 'Fixes',
    onlyPR: 'Fixed in',
  },
}

const userFacingChanges = {
  breaking: {
    description: 'A breaking change that will require a MVB',
    section: '**Breaking Changes:**',
    message: changeLinkPhrases.default,
  },
  dependency: {
    description: 'A change to a dependency that impact the user',
    section: '**Dependency Updates:**',
    message: changeLinkPhrases.default,
  },
  deprecation: {
    description: 'A API deprecation notice for users',
    section: '**Deprecations:**',
    message: changeLinkPhrases.default,
  },
  feat: {
    description: 'A new feature',
    section: '**Features:**',
    message: changeLinkPhrases.default,
  },
  fix: {
    description: 'A bug or regression fix',
    section: '**Bugfixes:**',
    message: changeLinkPhrases.fix,
  },
  misc: {
    description: 'Misc user-facing changes, like a UI update, which is not a fix or enhancement to how Cypress works',
    section: '**Misc:**',
    message: changeLinkPhrases.default,
  },
  perf: {
    description: 'Changes that improves performance',
    section: '**Performance:**',
    message: changeLinkPhrases.fix,
  },
}

const changeCatagories = {
  ...userFacingChanges,
  chore: {
    description: 'Changes to the build process or auxiliary tools and libraries such as documentation generation',
  },
  docs: {
    description: 'Documentation only changes',
  },
  refactor: {
    description: 'A code change that neither fixes a bug nor adds a feature that is not user-facing',
  },
  revert: {
    description: 'Reverts a previous commit',
  },
  test: {
    description: 'Adding missing or correcting existing tests',
  },
}

module.exports = {
  changeCatagories,
  userFacingChanges
}