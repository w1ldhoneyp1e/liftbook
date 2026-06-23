import {type Rule, type SourceCode} from 'eslint'

const MESSAGE = 'Variable assignment operator should stay on the declaration line.'

type EslintNode = NonNullable<Parameters<SourceCode['getText']>[0]>
type Token = NonNullable<ReturnType<SourceCode['getFirstToken']>>

function asEslintNode(node: unknown): EslintNode {
	return node as EslintNode
}

function isEqualsToken(token: Token | null): token is Token {
	return token?.value === '='
}

function getSplitAssignmentRange(sourceCode: SourceCode, node: EslintNode) {
	const init = 'init' in node
		? node.init
		: null

	if (!init) {
		return null
	}

	const equalsToken = sourceCode.getTokenBefore(asEslintNode(init), isEqualsToken)

	if (!equalsToken) {
		return null
	}

	const previousToken = sourceCode.getTokenBefore(equalsToken)

	if (!previousToken || previousToken.loc.end.line === equalsToken.loc.start.line) {
		return null
	}

	return {
		end: equalsToken.range[1],
		start: previousToken.range[1],
	}
}

const rule: Rule.RuleModule = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Move split variable assignment operators back to the declaration line.',
		},
		fixable: 'whitespace',
		schema: [],
		messages: {
			splitAssignment: MESSAGE,
		},
	},
	create(context: Rule.RuleContext): Rule.RuleListener {
		const sourceCode = context.sourceCode

		return {
			VariableDeclarator(node) {
				const range = getSplitAssignmentRange(sourceCode, asEslintNode(node))

				if (!range) {
					return
				}

				context.report({
					messageId: 'splitAssignment',
					node,
					fix(fixer) {
						return fixer.replaceTextRange([range.start, range.end], ' =')
					},
				})
			},
		}
	},
}

export default rule
