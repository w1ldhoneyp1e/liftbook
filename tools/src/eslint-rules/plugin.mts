import {type Rule} from 'eslint'
import consolidateNamedExports from './rules/consolidate-named-exports.mjs'
import joinSplitVariableAssignment from './rules/join-split-variable-assignment.mjs'

const plugin: {rules: Record<string, Rule.RuleModule>} = {
	rules: {
		'consolidate-named-exports': consolidateNamedExports,
		'join-split-variable-assignment': joinSplitVariableAssignment,
	},
}

export default plugin
