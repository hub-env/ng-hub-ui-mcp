#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { type Catalog, type CatalogExample, type CatalogLibrary, loadCatalog } from './catalog.js';
import { findLibrary, searchExamples, searchLibraries } from './search.js';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

/** Maximum examples returned in one call: enough to copy from without flooding the context. */
const MAX_EXAMPLES = 3;

let catalogPromise: ReturnType<typeof loadCatalog> | undefined;

/**
 * Loads the catalog on the first tool call rather than at startup, so the client's handshake is
 * never held up by the network.
 *
 * @returns The memoized catalog.
 */
async function catalog(): Promise<Catalog> {
	catalogPromise ??= loadCatalog();
	return (await catalogPromise).catalog;
}

/**
 * Wraps text as an MCP tool result.
 *
 * @param text Body.
 * @param isError Whether the call failed.
 * @returns Tool result.
 */
function reply(text: string, isError = false) {
	return { content: [{ type: 'text' as const, text }], ...(isError ? { isError } : {}) };
}

/**
 * Resolves the library argument or explains which names exist, so an agent can correct itself
 * instead of guessing a package that does not exist.
 *
 * @param name Library name from the caller.
 * @returns The library, or an error result.
 */
async function libraryOrError(name: string): Promise<CatalogLibrary | ReturnType<typeof reply>> {
	const data = await catalog();
	return (
		findLibrary(data, name) ??
		reply(`Unknown library "${name}". Available: ${data.libraries.map((l) => l.id).join(', ')}.`, true)
	);
}

/**
 * Header shared by every per-library answer: the package, the version the docs describe and
 * where to read more.
 *
 * @param library Library.
 * @returns Markdown header.
 */
function header(library: CatalogLibrary): string {
	const lines = [`# ${library.package} ${library.version}`, library.description, `Install: \`${library.install}\``];
	if (library.deprecated) lines.push(`DEPRECATED: ${library.deprecated.message}`);
	for (const guide of library.migrations ?? []) lines.push(`Migrating from ${guide.from}: ${guide.url}`);
	return lines.join('\n');
}

/**
 * Renders one example as fenced code blocks.
 *
 * @param example Example.
 * @returns Markdown.
 */
function renderExample(example: CatalogExample): string {
	const parts = [`## ${example.title ?? example.id} (id: ${example.id})`];
	if (example.templateCode) parts.push('Template:\n```html\n' + example.templateCode + '\n```');
	if (example.componentCode) parts.push('Component:\n```ts\n' + example.componentCode + '\n```');
	if (example.cssCode) parts.push('Styles:\n```scss\n' + example.cssCode + '\n```');
	return parts.join('\n\n');
}

const server = new McpServer({ name: 'ng-hub-ui', version });

server.registerTool(
	'search_components',
	{
		title: 'Find an ng-hub-ui library',
		description:
			'Finds which ng-hub-ui Angular library covers a UI need ("kanban board", "signature pad", "paginated table", any language) and recommends one. Call it before writing UI code so you use an existing component instead of inventing one. An empty query lists every library.',
		inputSchema: { query: z.string().describe('The need, in natural language.') }
	},
	async ({ query }) => {
		const data = await catalog();
		const ranked = query.trim() ? searchLibraries(data, query).slice(0, 5) : [];
		if (!query.trim()) {
			return reply(data.libraries.map((l) => `- ${l.id} (${l.package} ${l.version}): ${l.description}`).join('\n'));
		}
		if (!ranked.length) {
			return reply(
				`No ng-hub-ui library matches "${query}". Call search_components with an empty query to list all of them.`
			);
		}
		const [best] = ranked;
		const lines = [
			`Recommended: ${best.library.package} ${best.library.version}: ${best.library.description}`,
			`Install: \`${best.library.install}\` · Docs: ${best.library.docs.overview}`,
			...(best.library.migrations ?? []).map(
				(guide) => `Migration guide from ${guide.from}: ${guide.url}: ${guide.description}`
			),
			`Next: get_component_api("${best.library.id}") and get_examples("${best.library.id}").`,
			'',
			'Ranking:',
			...ranked.map(
				(m) => `- ${m.library.id} (score ${m.score}, matched: ${m.matched.join(', ')}): ${m.library.description}`
			)
		];
		return reply(lines.join('\n'));
	}
);

server.registerTool(
	'get_component_api',
	{
		title: 'Read the API of an ng-hub-ui library',
		description:
			'Returns the documented inputs, outputs, content templates and methods of an ng-hub-ui library, with types, defaults and descriptions, exactly as published on hubui.dev. Use it instead of guessing input or output names.',
		inputSchema: { library: z.string().describe('Library id or package, e.g. "board" or "ng-hub-ui-board".') }
	},
	async ({ library: name }) => {
		const library = await libraryOrError(name);
		if ('content' in library) return library;
		const { inputs, outputs, templates, methods } = library.api;
		const empty = inputs.length + outputs.length + templates.length + methods.length === 0;
		const body = empty
			? `This library has no API table on its documentation page; read its examples (get_examples) and ${library.docs.api}.`
			: '```json\n' + JSON.stringify(library.api, null, 1) + '\n```';
		return reply(
			`${header(library)}\nPeer dependencies: ${JSON.stringify(library.peerDependencies)}\nDocs: ${library.docs.api}\n\n${body}`
		);
	}
);

server.registerTool(
	'get_examples',
	{
		title: 'Get ng-hub-ui usage examples',
		description:
			'Returns working usage examples of an ng-hub-ui library (template, component and styles code) taken from the documentation site. Pass a query to pick the relevant ones ("drag and drop", "custom template"), or an id from a previous call. Without either it lists every example and shows the first few.',
		inputSchema: {
			library: z.string().describe('Library id or package, e.g. "board".'),
			query: z.string().optional().describe('What the example should show.'),
			id: z.string().optional().describe('Exact example id.')
		}
	},
	async ({ library: name, query, id }) => {
		const library = await libraryOrError(name);
		if ('content' in library) return library;
		const withCode = library.examples.filter((e) => e.templateCode || e.componentCode || e.cssCode);
		let picked: CatalogExample[];
		if (id) picked = withCode.filter((e) => e.id === id);
		else if (query) picked = searchExamples({ ...library, examples: withCode }, query);
		else picked = withCode;
		if (!picked.length) {
			return reply(`No example matches. Examples of ${library.id}: ${withCode.map((e) => e.id).join(', ')}.`, true);
		}
		const index = `Examples (${withCode.length}): ${withCode.map((e) => e.id).join(', ')}\nDocs: ${library.docs.examples}`;
		return reply([header(library), index, ...picked.slice(0, MAX_EXAMPLES).map(renderExample)].join('\n\n'));
	}
);

server.registerTool(
	'get_css_variables',
	{
		title: 'List the CSS variables of an ng-hub-ui library',
		description:
			'Lists the --hub-* CSS custom properties an ng-hub-ui library reads, grouped, with defaults and descriptions. Use it to theme a component instead of overriding its internal classes.',
		inputSchema: { library: z.string().describe('Library id or package, e.g. "modal".') }
	},
	async ({ library: name }) => {
		const library = await libraryOrError(name);
		if ('content' in library) return library;
		if (!library.cssVariables.length)
			return reply(`${header(library)}\n\nThis library declares no CSS variables of its own.`);
		const groups = library.cssVariables.map((group) =>
			[
				`## ${group.title}`,
				group.description ?? '',
				...group.variables.map(
					(v) => `- \`${v.name}\`: ${v.defaultValue ?? ''}${v.description ? ` (${v.description})` : ''}`
				)
			]
				.filter(Boolean)
				.join('\n')
		);
		return reply([header(library), ...groups].join('\n\n'));
	}
);

await server.connect(new StdioServerTransport());
