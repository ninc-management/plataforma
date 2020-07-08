module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  globals: {},
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 6,
    project: 'tsconfig.json',
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
    },
  },
  plugins: ['@typescript-eslint', '@typescript-eslint/tslint'],
  settings: {},
  rules: {
    'no-var': 'warn',
    'prefer-const': 'warn',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/indent': [
      'error',
      2,
      {
        SwitchCase: 1,
        CallExpression: { arguments: 'first' },
        FunctionExpression: { parameters: 'first' },
        FunctionDeclaration: { parameters: 'first' },
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/member-delimiter-style': [
      'warn',
      {
        singleline: {
          delimiter: 'semi',
          requireLast: true,
        },
      },
    ],
  },
};
