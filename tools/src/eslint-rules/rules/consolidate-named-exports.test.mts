import {describe, it} from 'node:test'
import tsParser from '@typescript-eslint/parser'
import {RuleTester} from 'eslint'
import rule from './consolidate-named-exports.mjs'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
	languageOptions: {
		ecmaVersion: 'latest',
		parser: tsParser,
		sourceType: 'module',
	},
})

ruleTester.run('consolidate-named-exports', rule, {
	valid: [
		{
			code: `const A = 1

export {
	A,
}
`,
		},
		{
			code: `type A = string
const B = 1

export type {
	A,
}

export {
	B,
}
`,
		},
	],
	invalid: [
		{
			code: `export const A = 1

const B = 2

export {B}
`,
			errors: [{messageId: 'exportsLast'}],
			output: `const A = 1

const B = 2

export {
	A,
	B,
}
`,
		},
		{
			code: `export type A = string

const B = 1

export {B}
`,
			errors: [{messageId: 'exportsLast'}],
			output: `type A = string

const B = 1

export type {
	A,
}

export {
	B,
}
`,
		},
		{
			code: `export type A = string

export type B = number
`,
			errors: [{messageId: 'groupExports'}],
			output: `type A = string

type B = number

export type {
	A,
	B,
}
`,
		},
		{
			code: `export {A} from './a'

export {B} from './a'
`,
			errors: [{messageId: 'groupExports'}],
			output: null,
		},
		{
			code: `// Keep this comment attached to the export.
export const A = 1

const B = 2
`,
			errors: [{messageId: 'exportsLast'}],
			output: null,
		},
	],
})
