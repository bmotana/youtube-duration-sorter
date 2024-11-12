module.exports = {
  env: {
      browser: true,
      es2021: true,
      webextensions: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
  },
  globals: {
      chrome: 'readonly'
  },
  rules: {
      'no-undef': 'warn',
      'no-console': 'off'
  }
};