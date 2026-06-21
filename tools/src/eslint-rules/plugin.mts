import {type Rule} from 'eslint'
import consolidateNamedExports from './rules/consolidate-named-exports.mjs'

const plugin: {rules: Record<string, Rule.RuleModule>} = {
	rules: {
		'consolidate-named-exports': consolidateNamedExports,
	},
}

export default plugin
