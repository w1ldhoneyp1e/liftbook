import {describe, it} from 'node:test'
import tsParser from '@typescript-eslint/parser'
import {RuleTester} from 'eslint'
import rule from './join-split-variable-assignment.mjs'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
	languageOptions: {
		ecmaVersion: 'latest',
		parser: tsParser,
		sourceType: 'module',
	},
})

ruleTester.run('join-split-variable-assignment', rule, {
	valid: [
		'const value = condition\n\t? left\n\t: right\n',
		'const [first, second] = await Promise.all([])\n',
		'const withoutInitializer: string\n',
	],
	invalid: [
		{
			code: `const value
    = condition
    \t? left
    \t: right
`,
			errors: [{messageId: 'splitAssignment'}],
			output: `const value = condition
    \t? left
    \t: right
`,
		},
		{
			code: `const [first, second]
    = await Promise.all([])
`,
			errors: [{messageId: 'splitAssignment'}],
			output: `const [first, second] = await Promise.all([])
`,
		},
		{
			code: `const value: string
    = getValue()
`,
			errors: [{messageId: 'splitAssignment'}],
			output: `const value: string = getValue()
`,
		},
	],
})
