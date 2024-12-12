import prettierConfig from './.prettierrc.js'
import eslintTsParser from '@typescript-eslint/parser'
import globals from 'globals'
import eslint_js from '@eslint/js'
import esp_react from '@eslint-react/eslint-plugin'
import esc_prettier from 'eslint-config-prettier'
import esp_prettier from 'eslint-plugin-prettier/recommended'
import esp_storybook from 'eslint-plugin-storybook'
import esp_import from 'eslint-plugin-import'
import esp_jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  eslint_js.configs.recommended,
  esp_react.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    languageOptions: {
      parser: eslintTsParser,
      parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2015,
      }
    },
    plugins: {
      storybook: esp_storybook,
      react: esp_react,
      import: esp_import,
      'jsx-a11y': esp_jsxA11y,
    },
    rules: {
      'prettier/prettier': [2, prettierConfig],
      'no-param-reassign': 0,
      'no-underscore-dangle': 0,
      'no-plusplus': 0,
      'no-restricted-syntax': 0,
      'import/prefer-default-export': 0,
      'react/prefer-stateless-function': 0,
      'react/destructuring-assignment': 0,
      'react/jsx-uses-vars': 'error',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: ['stories/**/*']
        }
      ],
      'jsx-a11y/mouse-events-have-key-events': 0
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  esc_prettier,
  esp_prettier,
]
