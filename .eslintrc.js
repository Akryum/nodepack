module.exports = {
  extends: [
    'plugin:vue-libs/recommended'
  ],
  plugins: [
    'node'
  ],
  env: {
    'jest': true
  },
  rules: {
    'indent': ['error', 2, {
      'MemberExpression': 'off'
    }],
    'node/no-extraneous-require': ['error', {
      'allowModules': [
        '@vue/cli-test-utils'
      ]
    }],
    'comma-dangle': ['error', 'always-multiline'],
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.js', '**/cli-test-utils/**/*.js'],
      rules: {
        'node/no-extraneous-require': 'off'
      }
    }
  ]
}
