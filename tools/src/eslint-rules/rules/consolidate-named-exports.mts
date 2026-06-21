import {
	type AST,
	type Rule,
	type SourceCode,
} from 'eslint'

const EXPORTS_LAST_MESSAGE = 'Export statements should appear at the end of the file'
const GROUP_EXPORTS_MESSAGE = 'Multiple named export declarations; consolidate all named exports into a single export declaration'

type ExportKind = 'type' | 'value'
type Range = AST.Range
type EslintNode = NonNullable<Parameters<SourceCode['getText']>[0]>

type IdentifierLike = {
	name: string,
	type: 'Identifier',
}

type DeclarationWithId = {
	id?: IdentifierLike | null,
	type: 'ClassDeclaration'
		| 'FunctionDeclaration'
		| 'TSEnumDeclaration'
		| 'TSInterfaceDeclaration'
		| 'TSTypeAliasDeclaration',
}

type VariableDeclarationLike = {
	declarations: {
		id: IdentifierLike | {type: string},
	}[],
	type: 'VariableDeclaration',
}

type LocalNamedExportDeclaration = {
	declaration?: DeclarationWithId | VariableDeclarationLike | null,
	exportKind?: ExportKind,
	range: Range,
	source?: null,
	specifiers: ExportSpecifierLike[],
	type: 'ExportNamedDeclaration',
}

type SourcedNamedExportDeclaration = {
	declaration?: null,
	exportKind?: ExportKind,
	source: {
		value: string,
	},
	type: 'ExportNamedDeclaration',
}

type NamedExportDeclaration = LocalNamedExportDeclaration | SourcedNamedExportDeclaration

type ProgramBodyNode = NamedExportDeclaration | {
	type: string,
}

type ExportSpecifierLike = {
	exported: IdentifierLike,
	exportKind?: ExportKind,
	local: IdentifierLike,
}

type ExportItem = {
	kind: ExportKind,
	text: string,
}

type FixPlan = {
	declarationNodes: LocalNamedExportDeclaration[],
	exportBlock: string,
	nodesToRemove: LocalNamedExportDeclaration[],
}

function asEslintNode(node: ProgramBodyNode): EslintNode {
	return node as unknown as EslintNode
}

function isIdentifierLike(node: IdentifierLike | {type: string}): node is IdentifierLike {
	return node.type === 'Identifier'
}

function isExportStatement(node: ProgramBodyNode): boolean {
	return node.type === 'ExportAllDeclaration'
		|| node.type === 'ExportDefaultDeclaration'
		|| node.type === 'ExportNamedDeclaration'
}

function isLocalNamedExport(node: ProgramBodyNode): node is LocalNamedExportDeclaration {
	return node.type === 'ExportNamedDeclaration' && !('source' in node && node.source)
}

function isNamedExport(node: ProgramBodyNode): node is NamedExportDeclaration {
	return node.type === 'ExportNamedDeclaration'
}

function hasComments(sourceCode: SourceCode, node: LocalNamedExportDeclaration) {
	const eslintNode = asEslintNode(node)

	return sourceCode.getCommentsBefore(eslintNode).length > 0
		|| sourceCode.getCommentsAfter(eslintNode).length > 0
		|| sourceCode.getCommentsInside(eslintNode).length > 0
}

function getDeclarationNames(declaration: LocalNamedExportDeclaration['declaration']): string[] {
	if (!declaration) {
		return []
	}

	if (
		declaration.type === 'FunctionDeclaration'
		|| declaration.type === 'ClassDeclaration'
		|| declaration.type === 'TSEnumDeclaration'
		|| declaration.type === 'TSInterfaceDeclaration'
		|| declaration.type === 'TSTypeAliasDeclaration'
	) {
		return declaration.id
			? [declaration.id.name]
			: []
	}

	if (declaration.type !== 'VariableDeclaration') {
		return []
	}

	return declaration.declarations
		.map(variableDeclaration => variableDeclaration.id)
		.filter(isIdentifierLike)
		.map(id => id.name)
}

function getExportKind(
	node: Pick<NamedExportDeclaration, 'exportKind'>,
	declaration: LocalNamedExportDeclaration['declaration'],
): ExportKind {
	if (node.exportKind === 'type') {
		return 'type'
	}

	if (
		declaration?.type === 'TSInterfaceDeclaration'
		|| declaration?.type === 'TSTypeAliasDeclaration'
	) {
		return 'type'
	}

	return 'value'
}

function getSpecifierText(sourceCode: SourceCode, specifier: ExportSpecifierLike): string {
	const localName = sourceCode.getText(specifier.local)
	const exportedName = sourceCode.getText(specifier.exported)
	const prefix = specifier.exportKind === 'type'
		? 'type '
		: ''

	if (localName === exportedName) {
		return `${prefix}${localName}`
	}

	return `${prefix}${localName} as ${exportedName}`
}

function getExportPrefixRange(sourceCode: SourceCode, node: LocalNamedExportDeclaration): Range | null {
	const exportToken = sourceCode.getFirstToken(asEslintNode(node))

	if (!exportToken || exportToken.value !== 'export') {
		return null
	}

	const nextToken = sourceCode.getTokenAfter(exportToken)

	if (!nextToken) {
		return null
	}

	return [exportToken.range[0], nextToken.range[0]]
}

function getRemovalRange(sourceCode: SourceCode, node: LocalNamedExportDeclaration): Range {
	const text = sourceCode.getText()
	let start = node.range[0]
	let end = node.range[1]
	let cursor = start - 1

	while (cursor >= 0 && (text[cursor] === ' ' || text[cursor] === '\t' || text[cursor] === '\r')) {
		cursor -= 1
	}

	if (text[cursor] === '\n') {
		const previousLineEnd = cursor
		cursor -= 1

		while (cursor >= 0 && (text[cursor] === ' ' || text[cursor] === '\t' || text[cursor] === '\r')) {
			cursor -= 1
		}

		if (text[cursor] === '\n') {
			start = previousLineEnd
		}
	}

	while (end < text.length && (text[end] === ' ' || text[end] === '\t' || text[end] === '\r')) {
		end += 1
	}

	if (text[end] === '\n') {
		end += 1
	}

	return [start, end]
}

function makeExportBlock(exports: ExportItem[]): string {
	const typeExports = exports
		.filter(exportItem => exportItem.kind === 'type')
		.map(exportItem => exportItem.text)
	const valueExports = exports
		.filter(exportItem => exportItem.kind === 'value')
		.map(exportItem => exportItem.text)
	const lines = []

	if (typeExports.length > 0) {
		lines.push('export type {')
		lines.push(...typeExports.map(exportName => `\t${exportName},`))
		lines.push('}')
	}

	if (valueExports.length > 0) {
		if (lines.length > 0) {
			lines.push('')
		}

		lines.push('export {')
		lines.push(...valueExports.map(exportName => `\t${exportName},`))
		lines.push('}')
	}

	return lines.join('\n')
}

function dedupeExports(exports: ExportItem[]): ExportItem[] {
	const seen = new Set()

	return exports.filter(exportItem => {
		const key = `${exportItem.kind}:${exportItem.text}`

		if (seen.has(key)) {
			return false
		}

		seen.add(key)

		return true
	})
}

function getFixPlan(sourceCode: SourceCode, body: ProgramBodyNode[]): FixPlan | null {
	const localNamedExports = body.filter(isLocalNamedExport)
	const lastNonExportStatementIndex = body.findLastIndex(node => !isExportStatement(node))
	const localNamedExportsBeforeEnd = lastNonExportStatementIndex === -1
		? []
		: body.slice(0, lastNonExportStatementIndex).filter(isLocalNamedExport)
	const typeExports = localNamedExports.filter(node => getExportKind(node, node.declaration) === 'type')
	const valueExports = localNamedExports.filter(node => getExportKind(node, node.declaration) === 'value')

	if (
		localNamedExports.length === 0
		|| (
			typeExports.length <= 1
			&& valueExports.length <= 1
			&& localNamedExportsBeforeEnd.length === 0
		)
	) {
		return null
	}

	const exportItems: ExportItem[] = []
	const nodesToRemove: LocalNamedExportDeclaration[] = []
	const declarationNodes: LocalNamedExportDeclaration[] = []

	for (const node of localNamedExports) {
		if (hasComments(sourceCode, node)) {
			return null
		}

		if (node.declaration) {
			const names = getDeclarationNames(node.declaration)

			if (names.length === 0) {
				return null
			}

			const kind = getExportKind(node, node.declaration)
			declarationNodes.push(node)
			exportItems.push(...names.map(name => ({
				kind,
				text: name,
			})))
			continue
		}

		if (node.specifiers.length === 0) {
			return null
		}

		nodesToRemove.push(node)
		const kind: ExportKind = node.exportKind === 'type'
			? 'type'
			: 'value'

		exportItems.push(...node.specifiers.map(specifier => ({
			kind,
			text: getSpecifierText(sourceCode, specifier),
		})))
	}

	return {
		declarationNodes,
		exportBlock: makeExportBlock(dedupeExports(exportItems)),
		nodesToRemove,
	}
}

function hasMultipleNamedExportDeclarations(body: ProgramBodyNode[]): boolean {
	const namedExports = body.filter(isNamedExport)
	const sourceExportGroups = new Map<string, number>()
	let localTypeExportCount = 0
	let localValueExportCount = 0

	for (const node of namedExports) {
		if (!node.source) {
			if (getExportKind(node, node.declaration) === 'type') {
				localTypeExportCount += 1
			}
			else {
				localValueExportCount += 1
			}

			continue
		}

		const key = `${getExportKind(node, node.declaration)}:${node.source.value}`
		sourceExportGroups.set(key, (sourceExportGroups.get(key) ?? 0) + 1)
	}

	return localTypeExportCount > 1
		|| localValueExportCount > 1
		|| [...sourceExportGroups.values()].some(count => count > 1)
}

function hasExportBeforeEnd(body: ProgramBodyNode[]): boolean {
	const lastNonExportStatementIndex = body.findLastIndex(node => !isExportStatement(node))

	return lastNonExportStatementIndex !== -1
		&& body.slice(0, lastNonExportStatementIndex).some(isExportStatement)
}

const rule: Rule.RuleModule = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Move local named exports to the end of the file and consolidate them.',
		},
		fixable: 'code',
		schema: [],
		messages: {
			exportsLast: EXPORTS_LAST_MESSAGE,
			groupExports: GROUP_EXPORTS_MESSAGE,
		},
	},
	create(context: Rule.RuleContext): Rule.RuleListener {
		const sourceCode = context.sourceCode

		return {
			Program(program) {
				const body = program.body as unknown as ProgramBodyNode[]
				const plan = getFixPlan(sourceCode, body)
				const hasExportsLastProblem = hasExportBeforeEnd(body)
				const hasGroupExportsProblem = hasMultipleNamedExportDeclarations(body)

				if (!plan && !hasExportsLastProblem && !hasGroupExportsProblem) {
					return
				}

				context.report({
					node: program as EslintNode,
					messageId: hasExportsLastProblem
						? 'exportsLast'
						: 'groupExports',
					fix(fixer: Rule.RuleFixer) {
						if (!plan) {
							return null
						}

						const fixes = []

						for (const node of plan.declarationNodes) {
							const range = getExportPrefixRange(sourceCode, node)

							if (!range) {
								return null
							}

							fixes.push(fixer.removeRange(range))
						}

						for (const node of plan.nodesToRemove) {
							fixes.push(fixer.removeRange(getRemovalRange(sourceCode, node)))
						}

						fixes.push(fixer.insertTextAfterRange(
							[0, sourceCode.getText().length],
							sourceCode.getText().endsWith('\n')
								? `\n${plan.exportBlock}\n`
								: `\n\n${plan.exportBlock}\n`,
						))

						return fixes
					},
				})
			},
		}
	},
}

export default rule
