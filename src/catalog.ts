import { readFileSync } from 'node:fs';

/** One API row as the documentation pages declare it. */
export interface ApiEntry {
	name: string;
	type?: string;
	required?: boolean;
	defaultValue?: string;
	description?: string;
	signature?: string;
	returns?: string;
	[key: string]: unknown;
}

/** One CSS-variable group, as projected from the design-system token spec. */
export interface CssVariableGroup {
	title: string;
	description?: string;
	variables: Array<{ name: string; defaultValue?: string; description?: string; type?: string }>;
}

/** One registered documentation example with its static code snippets. */
export interface CatalogExample {
	id: string;
	title?: string;
	component?: string;
	templateCode?: string;
	componentCode?: string;
	cssCode?: string;
}

/** Everything the server knows about one library. Written by scripts/generate-mcp-data.mjs. */
export interface CatalogLibrary {
	id: string;
	package: string;
	version: string;
	peerDependencies: Record<string, string>;
	description: string;
	overview?: string;
	highlights: Array<{ title: string; description: string }>;
	deprecated?: { message: string; replacementName?: string };
	install: string;
	docs: { overview: string; api: string; examples: string };
	api: { inputs: ApiEntry[]; outputs: ApiEntry[]; templates: ApiEntry[]; methods: ApiEntry[] };
	cssVariables: CssVariableGroup[];
	examples: CatalogExample[];
	/** Guides for moving to this library from another package. Optional: older catalogs lack it. */
	migrations?: Array<{ from: string; url: string; title: string; description: string }>;
	searchText: string;
}

/** The whole catalog. `schemaVersion` changes only when the shape above does. */
export interface Catalog {
	schemaVersion: 1;
	siteVersion: string;
	generatedAt: string;
	libraries: CatalogLibrary[];
}

/** Published copy of the catalog, refreshed on every deploy of hubui.dev. */
export const LIVE_CATALOG_URL = 'https://hubui.dev/mcp/catalog.json';

const FETCH_TIMEOUT_MS = 3000;

/**
 * Accepts a parsed document only when it has the shape this server version understands, so a
 * future catalog format published on the site never crashes an older installed server.
 *
 * @param value Parsed JSON.
 * @returns Whether the value is a usable catalog.
 */
export function isCatalog(value: unknown): value is Catalog {
	const candidate = value as Partial<Catalog> | null;
	return candidate?.schemaVersion === 1 && Array.isArray(candidate.libraries) && candidate.libraries.length > 0;
}

/**
 * Loads the catalog: the live copy on hubui.dev first, so every site deploy reaches installed
 * servers without a new npm release, and the copy bundled in the package when the network is
 * slow, absent, or disabled with `HUB_UI_MCP_OFFLINE=1`.
 *
 * @returns The catalog and where it came from.
 */
export async function loadCatalog(): Promise<{ catalog: Catalog; source: 'live' | 'bundled' }> {
	if (process.env['HUB_UI_MCP_OFFLINE'] !== '1') {
		try {
			const response = await fetch(LIVE_CATALOG_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
			const live: unknown = response.ok ? await response.json() : null;
			if (isCatalog(live)) return { catalog: live, source: 'live' };
		} catch {
			// Offline or slow network: the bundled copy below is the documented fallback.
		}
	}
	const bundled: unknown = JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'));
	if (!isCatalog(bundled)) throw new Error('ng-hub-ui-mcp: the bundled catalog is missing or malformed.');
	return { catalog: bundled, source: 'bundled' };
}
