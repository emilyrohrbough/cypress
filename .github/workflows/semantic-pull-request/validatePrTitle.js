const parser = require('conventional-commits-parser').sync;

const userFacingChanges = {
  breaking: {
    description: 'A breaking change that will require a MVB',
    title: '**Breaking Changes:**',
  },
  dependency: {
    description: 'A change to a dependency that impact the user',
    title: '**Dependency Updates:**',
  },
  deprecation: {
    description: 'A API deprecation notice for users',
    title: '**Deprecations:**',
  },
  feat: {
    description: 'A new feature',
    title: '**Features:**',
  },
  fix: {
    description: 'A bug or regression fix',
    title: '**Bugfixes:**',
  },
  misc: {
    description: 'Misc user-facing changes, like a UI update, which is not a fix or enhancement to how Cypress works',
    title: '**Misc:**',
  },
  perf: {
    description: 'Changes that improves performance',
    title: '**Performance:**',
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

const types = Object.keys(changeCatagories)

const parserOpts = {
  headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
  breakingHeaderPattern: /^(\w*)(?:\((.*)\))?!: (.*)$/,
  headerCorrespondence: [
    'type',
    'scope',
    'subject'
  ],
  noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
  revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
  revertCorrespondence: ['header', 'hash'],
  issuePrefixes: ['#']
}

module.exports = async function validatePrTitle(prTitle) {
  const result = parser(prTitle, parserOpts)

  console.log('Validate PR Tile for:', prTitle)
  console.log('Result:', result)


  function printAvailableTypes() {
    return `Available types:\n${types
      .map((type) => ` - ${type}: ${changeCatagories[type].description}`)
      .join('\n')}`;
  }

  if (!result.type) {
    throw new Error(
      `No release type found in pull request title "${prTitle}". Add a prefix to indicate what kind of release this pull request corresponds to. Cypress types are:/\n\n${printAvailableTypes()}`
    );
  }

  if (!result.subject) {
    throw new Error(`No subject found in pull request title "${prTitle}".`);
  }

  if (!types.includes(result.type)) {
    throw new Error(
      `Unknown release type "${result.type}" found in pull request title "${prTitle}".
      \n\n${printAvailableTypes()}`
    );
  }
};
