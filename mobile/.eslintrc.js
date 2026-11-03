module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['*.config.js', 'metro.config.js', 'babel.config.js'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    {
      files: ['__tests__/**/*.{js,ts}', '**/*.test.{js,ts,tsx}'],
      env: {
        jest: true,
      },
    },
  ],
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/'],
};
