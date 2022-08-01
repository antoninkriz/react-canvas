const prettierConfig = require('./.prettierrc.js');

module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: ['airbnb', 'prettier', 'prettier/react', 'plugin:storybook/recommended', 'plugin:storybook/recommended'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': [2, prettierConfig],
    'no-param-reassign': 0,
    'no-underscore-dangle': 0,
    'no-plusplus': 0,
    'no-restricted-syntax': 0,
    'import/prefer-default-export': 0,
    'react/prefer-stateless-function': 0,
    'react/destructuring-assignment': 0,
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['stories/**/*']
    }],
    'jsx-a11y/mouse-events-have-key-events': 0
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};