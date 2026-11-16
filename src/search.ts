import type { Catalog, CatalogExample, CatalogLibrary } from './catalog.js';

/** Words too common to tell libraries apart, in the languages agents usually write in. */
const STOP_WORDS = new Set([
	'a',
	'an',
	'and',
	'angular',
	'component',
	'components',
	'for',
	'in',
	'of',
	'the',
	'to',
	'with',
	'i',
	'need',
	'want',
	'un',
	'una',
	'el',
	'la',
	'los',
	'las',
	'de',
	'del',
	'para',
	'con',
	'y',
	'en',
	'que',
	'componente',
	'necesito',
	'quiero',
	'ng',
	'hub',
	'ui'
]);

/**
 * Lower-cases, strips accents and splits on anything that is not a letter or digit, so
 * «Paginación» and "pagination" meet on the same stem prefix.
 *
 * @param text Free text.
 * @returns Distinct meaningful tokens.
 */
export function tokenize(text: string): string[] {
	const words = text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.split(/[^\p{L}\p{N}]+/u)
		.filter((word) => word.length > 1 && !STOP_WORDS.has(word));
	return [...new Set(words)];
}

/**
 * Splits field text into normalized words. Matching works on word starts, not substrings, so
 * "firma" no longer hits "confirmar".
 *
 * @param text Field text.
 * @returns Words, accents stripped.
 */
function words(text: string): string[] {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
}

/**
 * Whether a token starts any word of a field, either whole or, for tokens of five letters or
 * more, by its first five letters. That crude stem bridges inflections across languages
 * (tabla/table, paginada/paginable) without a stemmer per locale.
 *
 * @param field Words of the field.
 * @param token Query token.
 * @returns Whether it matches.
 */
function matches(field: string[], token: string): boolean {
	const stem = token.length >= 5 ? token.slice(0, 5) : token;
	return field.some((word) => word.startsWith(stem));
}

/** A ranked library with the query words that put it there. */
export interface LibraryMatch {
	library: CatalogLibrary;
	score: number;
	matched: string[];
}

/**
 * Ranks libraries for a need expressed in natural language. Fields are weighted by how
 * deliberately they describe the library: its name first, then its own summary, then the SEO
 * copy in every locale, then example titles and API names. Each token is scaled by how rare it
 * is across libraries, so "drag" (shared by board, calendar, sortable) counts for less than
 * "kanban" or "signature".
 *
 * @param catalog Loaded catalog.
 * @param query Need, e.g. "tablero kanban" or "paginated table".
 * @returns Libraries with a positive score, best first.
 */
export function searchLibraries(catalog: Catalog, query: string): LibraryMatch[] {
	const tokens = tokenize(query);
	const indexed = catalog.libraries.map((library) => ({
		library,
		fields: [
			[words(`${library.id} ${library.package}`), 6],
			[
				words(
					`${library.description} ${library.overview ?? ''} ${library.highlights.map((h) => `${h.title} ${h.description}`).join(' ')}`
				),
				3
			],
			[words(library.searchText), 2],
			[
				words(
					[
						...library.examples.map((e) => e.title ?? ''),
						...Object.values(library.api)
							.flat()
							.map((entry) => entry.name)
					].join(' ')
				),
				1
			]
		] as Array<[string[], number]>
	}));
	const rarity = new Map(
		tokens.map((token) => {
			const hits = indexed.filter(({ fields }) => fields.some(([field]) => matches(field, token))).length;
			return [token, hits ? Math.log(1 + indexed.length / hits) : 0];
		})
	);
	return indexed
		.map(({ library, fields }) => {
			let score = 0;
			const matched: string[] = [];
			for (const token of tokens) {
				const weight = fields.reduce((sum, [field, w]) => (matches(field, token) ? sum + w : sum), 0);
				if (weight) matched.push(token);
				score += weight * (rarity.get(token) ?? 0);
			}
			return { library, score: Math.round(score * 10) / 10, matched };
		})
		.filter((match) => match.score > 0)
		.sort((a, b) => b.score - a.score || a.library.id.localeCompare(b.library.id));
}

/**
 * Finds a library by any name an agent is likely to use: `board`, `ng-hub-ui-board`, or the
 * `hub-board` element selector.
 *
 * @param catalog Loaded catalog.
 * @param name Library name as written by the caller.
 * @returns The library, or undefined.
 */
export function findLibrary(catalog: Catalog, name: string): CatalogLibrary | undefined {
	const wanted = name
		.trim()
		.toLowerCase()
		.replace(/^ng-hub-ui-/, '')
		.replace(/^hub-/, '');
	return catalog.libraries.find((library) => library.id === wanted || library.package === name.trim().toLowerCase());
}

/**
 * Ranks the examples of one library against a query, using the title first and the code second.
 *
 * @param library Library to look in.
 * @param query What the caller wants to see, e.g. "drag and drop".
 * @returns Matching examples, best first.
 */
export function searchExamples(library: CatalogLibrary, query: string): CatalogExample[] {
	const tokens = tokenize(query);
	return library.examples
		.map((example) => {
			const title = words(`${example.id} ${example.title ?? ''}`);
			const code = words(`${example.templateCode ?? ''} ${example.componentCode ?? ''}`);
			const score = tokens.reduce((sum, t) => sum + (matches(title, t) ? 3 : 0) + (matches(code, t) ? 1 : 0), 0);
			return { example, score };
		})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.map(({ example }) => example);
}
