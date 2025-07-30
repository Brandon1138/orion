// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
	{
		ignores: [
			'**/dist/**',
			'**/node_modules/**',
			'**/coverage/**',
			'**/*.min.js',
			'**/build/**',
			'**/out/**',
			'**/.vite/**',
			'**/.turbo/**',
			'**/package-lock.json',
			'**/*.lock',
			'fixtures/**',
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			// TypeScript specific rules
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
			'@typescript-eslint/prefer-nullish-coalescing': 'error',
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/no-unnecessary-condition': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',

			// General code quality rules
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'prefer-const': 'error',
			'no-var': 'error',
			'object-shorthand': 'error',
			'prefer-template': 'error',

			// Import organization
			'sort-imports': [
				'error',
				{
					ignoreCase: true,
					ignoreDeclarationSort: true,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
				},
			],
		},
	},
	{
		files: ['**/*.js', '**/*.mjs'],
		extends: [tseslint.configs.disableTypeChecked],
		languageOptions: {
			globals: {
				console: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				require: 'readonly',
				module: 'readonly',
				exports: 'readonly',
				global: 'readonly',
				Buffer: 'readonly',
			},
		},
		rules: {
			// Disable TypeScript-specific rules for JS files
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		files: [
			'demo.js',
			'scripts/**/*.js',
			'**/*.demo.js',
			'**/*.test.js',
			'**/*.spec.js',
			'packages/cli/**/*.ts',
			'packages/cli/**/*.js',
		],
		rules: {
			// Allow console in demo, script, and CLI files
			'no-console': 'off',
		},
	},
	// Prettier must be last to override conflicting rules
	prettier
);
