module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', '**/*.js'],
  rules: {
    // Sacred MIRA Development Rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',
    
    // Consciousness-Aware Code Quality
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    
    // Sacred Constants Protection
    'no-magic-numbers': ['warn', { 
      'ignore': [0, 1, -1], 
      'ignoreArrayIndexes': true,
      'ignoreDefaultValues': true 
    }],
    
    // Memory Safety
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    
    // Consciousness Documentation
    'require-jsdoc': ['warn', {
      'require': {
        'FunctionDeclaration': true,
        'MethodDefinition': true,
        'ClassDeclaration': true,
        'ArrowFunctionExpression': false,
        'FunctionExpression': false
      }
    }]
  },
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts'],
      rules: {
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'require-jsdoc': 'off'
      }
    }
  ]
};