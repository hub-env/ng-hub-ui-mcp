# ng-hub-ui-mcp

**Español** | [English](./README.md)

Servidor [MCP](https://modelcontextprotocol.io) con el que los asistentes de programación (Claude Code, Cursor, VS Code con Copilot y cualquier otro cliente MCP) consultan la documentación real de las bibliotecas Angular **ng-hub-ui** mientras escriben código. El asistente puede preguntar qué biblioteca cubre una necesidad, leer sus inputs y outputs, copiar un ejemplo que funciona y consultar las variables CSS en lugar de adivinar una API que no existe.

## Documentación y ejemplos

Este paquete forma parte de [Hub UI](https://hubui.dev/es/), una colección de bibliotecas de componentes Angular para aplicaciones standalone.

- Hub UI: https://hubui.dev/es/
- Guía para agentes de IA: https://hubui.dev/es/ai-agents/
- Hub UI en GitHub (incidencias, hoja de ruta y contribuciones): https://github.com/hub-env/hub-ui

## 📋 Índice

- [Herramientas](#-herramientas)
- [Instalación](#-instalación)
- [De dónde salen los datos](#-de-dónde-salen-los-datos)
- [Configuración](#-configuración)
- [Contribuir](#-contribuir)
- [Apoyo](#-apoyo)
- [Soporte profesional](#-soporte-profesional)
- [Licencia](#-licencia)

## 🧰 Herramientas

| Herramienta | Argumentos | Devuelve |
| :--- | :--- | :--- |
| `search_components` | `query` | La biblioteca que mejor cubre una necesidad escrita en lenguaje natural («tablero kanban», "paginated table", «firma»), el comando de instalación y una clasificación. Con la consulta vacía, lista todas. |
| `get_component_api` | `library` | Inputs, outputs, plantillas de contenido y métodos con su tipo, valor por defecto y descripción, además de las dependencias peer. |
| `get_examples` | `library`, `query?`, `id?` | Hasta tres ejemplos que funcionan (código de plantilla, componente y estilos) y los identificadores del resto. |
| `get_css_variables` | `library` | Las propiedades `--hub-*` que lee la biblioteca, agrupadas, con valor por defecto y descripción. |

`library` admite el identificador corto (`board`), el nombre del paquete (`ng-hub-ui-board`) o el prefijo del elemento (`hub-board`). Si el nombre no existe, la respuesta trae la lista de nombres válidos para que el asistente se corrija.

Las bibliotecas con guía de migración incluyen su enlace en cada respuesta, y una búsqueda por el paquete que se sustituye («migrar desde ngx-sortablejs») encuentra la biblioteca que lo reemplaza.

La búsqueda lee los textos de la web en los ocho idiomas a los que está traducida, así que una petición en español, francés o japonés encuentra la misma biblioteca que una en inglés.

## 🚀 Instalación

El servidor funciona por stdio a través de `npx`, de modo que no hay nada que instalar de forma global. Necesita Node.js 20 o posterior.

### Claude Code

```bash
claude mcp add hub-ui -- npx -y ng-hub-ui-mcp
```

Con `--scope project` se guarda en el `.mcp.json` del repositorio y lo comparte todo el equipo.

### Cursor

`.cursor/mcp.json` en el proyecto, o `~/.cursor/mcp.json` para todos los proyectos:

```json
{
	"mcpServers": {
		"hub-ui": { "command": "npx", "args": ["-y", "ng-hub-ui-mcp"] }
	}
}
```

### VS Code (GitHub Copilot)

`.vscode/mcp.json` en el espacio de trabajo:

```json
{
	"servers": {
		"hub-ui": { "type": "stdio", "command": "npx", "args": ["-y", "ng-hub-ui-mcp"] }
	}
}
```

### Cualquier otro cliente MCP

Comando `npx`, argumentos `-y ng-hub-ui-mcp`, transporte stdio.

## 📦 De dónde salen los datos

En este paquete no hay nada escrito a mano. Cada build de la web de documentación genera un catálogo a partir de las mismas fuentes que pinta la web: las tablas de API de la página de cada biblioteca, los ejemplos registrados con su código y las tablas de variables CSS que se generan desde la especificación de tokens del sistema de diseño.

- En la primera llamada, el servidor descarga el catálogo vigente de `https://hubui.dev/mcp/catalog.json`, de modo que sigue cada despliegue de la web sin necesidad de publicar otra versión en npm.
- Si la descarga tarda más de tres segundos o falla, usa la copia que lleva dentro el paquete, que coincide con la documentación del día en que se publicó.

Las respuestas describen la última versión publicada de cada biblioteca. Cada respuesta indica esa versión, así que un asistente que trabaje en un proyecto fijado a una versión anterior puede darse cuenta.

## ⚙️ Configuración

| Variable | Efecto |
| :--- | :--- |
| `HUB_UI_MCP_OFFLINE=1` | No contacta nunca con hubui.dev; responde siempre con el catálogo incluido en el paquete. |

## 🤝 Contribuir

Lee primero la [guía de contribución](https://github.com/hub-env/hub-ui/blob/main/CONTRIBUTING.md). El código del servidor es público en [hub-env/ng-hub-ui-mcp](https://github.com/hub-env/ng-hub-ui-mcp). El catálogo se genera al compilar a partir de las páginas de la web de documentación, así que una respuesta incorrecta casi siempre viene de una página mal documentada: al corregir la página, se corrigen la web y el servidor a la vez.

¿Has encontrado un error o quieres pedir algo? Abre una incidencia: https://github.com/hub-env/hub-ui/issues

## ☕ Apoyo

¿Te gusta el proyecto? Puedes apoyarlo invitándome a un café ☕:
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/carlosmorcillo)

## 💼 Soporte profesional

Estas bibliotecas las mantiene [Carlos Morcillo Fernández](https://www.carlosmorcillo.com), arquitecto frontend freelance que trabaja con equipos que construyen y mantienen aplicaciones Angular.

Si tu equipo depende de Hub UI y necesita más de lo que se resuelve en una incidencia, ese es mi trabajo: auditorías de arquitectura, sistemas de diseño, migraciones de Angular y mentoría de equipos. Los proyectos que además necesitan diseño y un equipo completo los llevo a través de [Frog Hub](https://froghub.es), mi estudio de desarrollo.

Echa un vistazo a [los servicios](https://www.carlosmorcillo.com/servicios/) o [cuéntame tu proyecto](https://www.carlosmorcillo.com/contacto/).

## 📄 Licencia

Este proyecto se distribuye con licencia MIT; consulta el fichero [LICENSE](LICENSE) para más detalles.

MIT © ng-hub-ui contributors
