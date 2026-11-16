# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The major version
tracks the Angular major the ng-hub-ui libraries target, as every package in the family does.

## [22.0.1] - 2026-11-16

### Fixed

- The package now links to its public source repository, [hub-env/ng-hub-ui-mcp](https://github.com/hub-env/ng-hub-ui-mcp).
  The previous link pointed to a repository that does not hold the server.

## [22.0.0] - 2026-11-15

### Added

- First release. An MCP server over stdio with four tools: `search_components`,
  `get_component_api`, `get_examples` and `get_css_variables`.
- The catalog is generated from the documentation site's own pages: API tables, registered
  examples with their code, and the CSS-variable tables. It is read live from
  `https://hubui.dev/mcp/catalog.json`, and the package carries a copy for when the network fails
  or `HUB_UI_MCP_OFFLINE=1` is set.
- Libraries with a migration guide (`ng-hub-ui-signature` from angular2-signaturepad,
  `ng-hub-ui-sortable` from ngx-sortablejs) point to it in every answer, and search finds them by
  the package being replaced.
- Search reads the site copy in its eight languages and matches on word starts, so «firma» finds
  the signature field and not «confirmar».
