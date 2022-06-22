module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  globals: {},
  plugins: ['import'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    project: ['tsconfig.eslint.json'],
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
    },
  },
  settings: {},
  rules: {
    'no-var': 'warn',
    'no-console': 'warn',
    'prefer-const': 'warn',
    indent: 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/member-delimiter-style': ['off'],
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      },
    ],
    'import/named': 'warn',
    'import/no-unresolved': 'off',
    'import/order': [
      'error',
      {
        groups: [['external', 'builtin'], ['internal', 'sibling', 'parent', 'index'], 'object'],
        pathGroups: [
          {
            pattern: '**/validators/**',
            group: 'object',
          },
          {
            pattern: 'app/**',
            group: 'internal',
          },
          {
            pattern: '@models/**',
            group: 'object',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
};
