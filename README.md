# ng-hub-ui-mcp

[Español](./README.es.md) | **English**

An [MCP](https://modelcontextprotocol.io) server that lets coding assistants (Claude Code, Cursor, VS Code with Copilot and any other MCP client) read the real documentation of the **ng-hub-ui** Angular libraries while they write code. The assistant can ask which library fits a need, read its inputs and outputs, copy a working example and look up the CSS variables, instead of guessing an API that does not exist.

## Documentation and Live Examples

This package is part of [Hub UI](https://hubui.dev/en/), a collection of Angular component libraries for standalone apps.

- Hub UI: https://hubui.dev/en/
- Guide for AI agents: https://hubui.dev/en/ai-agents/
- Hub UI on GitHub (issues, roadmap and contributing): https://github.com/hub-env/hub-ui

## 📋 Table of Contents

- [Tools](#-tools)
- [Installation](#-installation)
- [Where the data comes from](#-where-the-data-comes-from)
- [Configuration](#-configuration)
- [Contribution](#-contribution)
- [Support](#-support)
- [Commercial support](#-commercial-support)
- [License](#-license)

## 🧰 Tools

| Tool | Arguments | Returns |
| :--- | :--- | :--- |
| `search_components` | `query` | The library that best covers a need written in natural language ("kanban board", "tabla paginada", "firma"), the install command and a ranking. An empty query lists every library. |
| `get_component_api` | `library` | Inputs, outputs, content templates and methods with their types, defaults and descriptions, plus the peer dependencies. |
| `get_examples` | `library`, `query?`, `id?` | Up to three working examples (template, component and styles code) and the ids of the rest. |
| `get_css_variables` | `library` | The `--hub-*` custom properties the library reads, grouped, with defaults and descriptions. |

`library` accepts the short id (`board`), the package name (`ng-hub-ui-board`) or the element prefix (`hub-board`). An unknown name returns the list of valid ones, so the assistant can correct itself.

Libraries with a migration guide answer with its link, and a search for the package being replaced ("migrate from ngx-sortablejs") finds the library that replaces it.

Search reads the site copy in all eight languages the site is translated into, so a request written in Spanish, French or Japanese finds the same library as one written in English.

## 🚀 Installation

The server runs over stdio through `npx`, so there is nothing to install globally. It needs Node.js 20 or later.

### Claude Code

```bash
claude mcp add hub-ui -- npx -y ng-hub-ui-mcp
```

Add `--scope project` to write it into the repository's `.mcp.json` and share it with the team.

### Cursor

`.cursor/mcp.json` in the project, or `~/.cursor/mcp.json` for every project:

```json
{
	"mcpServers": {
		"hub-ui": { "command": "npx", "args": ["-y", "ng-hub-ui-mcp"] }
	}
}
```

### VS Code (GitHub Copilot)

`.vscode/mcp.json` in the workspace:

```json
{
	"servers": {
		"hub-ui": { "type": "stdio", "command": "npx", "args": ["-y", "ng-hub-ui-mcp"] }
	}
}
```

### Any other MCP client

Command `npx`, arguments `-y ng-hub-ui-mcp`, transport stdio.

## 📦 Where the data comes from

Nothing is written by hand for this package. Each build of the documentation site generates a catalog from the same sources the site renders: the API tables of every library page, the registered examples with their code, and the CSS-variable tables generated from the design-system token spec.

- On the first call the server downloads the current catalog from `https://hubui.dev/mcp/catalog.json`, so it follows every site deploy without a new npm release.
- If that takes longer than three seconds or fails, it uses the copy bundled in the package, which matches the docs on the day the package was published.

The answers describe the latest published version of each library. Every answer states that version, so an assistant working on a project pinned to an older one can tell.

## ⚙️ Configuration

| Variable | Effect |
| :--- | :--- |
| `HUB_UI_MCP_OFFLINE=1` | Never contacts hubui.dev; always answers from the bundled catalog. |

## 🤝 Contribution

Read the [contributing guide](https://github.com/hub-env/hub-ui/blob/main/CONTRIBUTING.md) first. The server source is public in [hub-env/ng-hub-ui-mcp](https://github.com/hub-env/ng-hub-ui-mcp). Its catalog is generated from the pages of the documentation site at build time, so a wrong answer is almost always a wrong docs page: once the page is fixed, the site and the server both get the fix.

Found a bug or have a request? Open an issue: https://github.com/hub-env/hub-ui/issues

## ☕ Support

Do you like this project? You can support it by buying me a coffee ☕:
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/carlosmorcillo)

## 💼 Commercial support

These libraries are maintained by [Carlos Morcillo Fernández](https://www.carlosmorcillo.com), a freelance frontend architect working with teams that build and maintain Angular applications.

If your team depends on Hub UI and needs more than an issue thread can solve, that is my day job: architecture audits, design systems, Angular migrations and team mentoring. For projects that also need design and a full team, I run them through [Frog Hub](https://froghub.es), my development studio.

Have a look at [the services](https://www.carlosmorcillo.com/en/services/) or [tell me about your project](https://www.carlosmorcillo.com/en/contact/).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT © ng-hub-ui contributors
