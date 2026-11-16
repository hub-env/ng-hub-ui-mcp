# Functionalities of ng-hub-ui-mcp

This table lists what the `ng-hub-ui-mcp` server does and whether [README.md](./README.md)
documents it. The server has no UI, so it has no examples on the documentation site; the guide for
agents at https://hubui.dev/en/ai-agents/ explains how to connect it.

## Tools

| Category | Functionality | Documented |
| :--- | :--- | :---: |
| **Search** | `search_components` recommends a library for a need in natural language | ✅ |
| | Matches queries written in any of the site's eight languages | ✅ |
| | Empty query lists every library | ✅ |
| | Finds a library by the package it replaces and links its migration guide | ✅ |
| **API** | `get_component_api` returns inputs, outputs, templates and methods | ✅ |
| | Includes the library's peer dependencies | ✅ |
| **Examples** | `get_examples` returns up to three examples with their code | ✅ |
| | Filters by `query` or picks one by `id` | ✅ |
| **Styling** | `get_css_variables` returns the grouped `--hub-*` properties with defaults | ✅ |
| **Names** | Accepts the id, the package name or the `hub-` element prefix | ✅ |
| | Unknown names answer with the list of valid ones | ✅ |

---

## Data

| Category | Functionality | Documented |
| :--- | :--- | :---: |
| **Source** | Live catalog from `https://hubui.dev/mcp/catalog.json` | ✅ |
| | Bundled catalog fallback after three seconds or on failure | ✅ |
| | `HUB_UI_MCP_OFFLINE=1` skips the network | ✅ |
| | Rejects a live catalog in a schema version it does not know | ❌ |
