# ToolShelf Copilot Instructions

## Big picture
- Static, offline-first web app served from `toolshelf/` (no build system).
- Each tool is a standalone page under `toolshelf/<tool>/index.html` with its own `css/` and `js/` folders.
- Shared assets and core logic live in `toolshelf/shared/` (CSS, JS, config).
- Blog is static HTML under `toolshelf/blog/<slug>/index.html` with JS-driven listings.

## Architecture and data flow
- Global namespace is `window.ToolShelf`; avoid module bundlers or frameworks.
- Core app wiring: `toolshelf/shared/js/core/app.js` (tool init, navigation, global events).
- Common infra: `toolshelf/shared/js/core/events.js` (EventManager + global keyboard), `toolshelf/shared/js/core/utils.js` (debounce, storage, clipboard), `toolshelf/shared/config/constants.js` (limits, transform order, keyboard labels).
- Tool pattern: extend `window.ToolShelf.BaseTool` from `toolshelf/shared/js/tools/base-tool.js`, call `super('tool-id')`, wire DOM IDs in `initializeElements()`, add listeners via `addEventListener()` so cleanup is tracked.
- Keep transformations pure where possible; use ordered transforms from `window.ToolShelf.Constants.TRANSFORM_ORDER` (see `toolshelf/text-transformer/js/transformer.js`).

## Tool-specific conventions
- DOM lookups are ID-based; missing required elements should throw early (see `base64-encoder/js/base64-encoder.js`).
- Use `window.ToolShelf.Utils.debounce` for input-driven updates.
- Use `Utils.storage` for persistence with the `toolshelf_` prefix; do not add new storage prefixes.
- Toasts and error handling are centralized via `BaseTool.handleError()` and `BaseTool.showToast()`.

## Blog workflow (static)
- New posts: create `toolshelf/blog/<slug>/index.html` using the template in `blog-post-manual.md`.
- Update `toolshelf/blog/js/blog-config.js` to register the post metadata and tags.
- Update `toolshelf/sitemap.xml` and `toolshelf/_redirects` for the new slug.

## CSS/SEO conventions
- CSS is modular under `toolshelf/shared/css/` (variables, base, components, layout, responsive). Add or extend files instead of creating tool-local global styles.
- Home/SEO metadata live in `toolshelf/index.html`; keep Open Graph, Twitter, JSON-LD consistent with new content.

## Local workflow
- No build or test commands; open `toolshelf/index.html` (or a tool page) directly in a browser or via any static file server.
