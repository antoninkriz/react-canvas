module.exports = {
  'stories': ['../stories/**/*'],
  'addons': ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
  'framework': {
    name: '@storybook/react-webpack5',
    options: {}
  },
  features: {
    storyStoreV7: false
  },
  core: {
    disableTelemetry: true
  },
  docs: {
    autodocs: 'tag'
  }
}