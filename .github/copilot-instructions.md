# ToolShelf AI Coding Instructions

## 1. Project Overview

**ToolShelf** is an offline-first web application providing text transformation tools and a technical blog. It's built with vanilla JavaScript (ES6+), modern CSS3, and HTML5—no frameworks, no build process, no package.json.

**Key Sites**: [Live](https://toolshelf.tech) | [GitHub](https://github.com/mir-shakir/ToolShelf)

**Current Active Tasks** (from `.github/plan.md`):
- Implement categorized blog sidebar & layout restructure
- Add resizable text areas to JSON formatter
- Add syntax highlighting to JSON formatter (configurable)

---

## 2. Architecture & Design Patterns

### Big Picture: Two-Layer Modular Architecture

```
toolshelf/ (root)
├── shared/         # Global reusable logic (all tools inherit from here)
├── blog/           # Blog section with sidebar categorization
├── [tool-name]/    # Each tool folder: json-formatter/, text-transformer/, etc.
└── assets/         # Shared CSS, images, configuration
```

**Core Design Principle**: **Inherit-Based Composition**
- Every tool extends `BaseTool` from `shared/js/core/`
- Shared UI patterns: navigation, toasts, keyboard shortcuts, analytics
- Modular CSS: variables → base → components → layout → responsive

### Key Architectural Patterns

**1. Component Inheritance (JavaScript)**
```javascript
// tools extend BaseTool for shared functionality
class TextTransformer extends BaseTool {
    constructor() {
        super('text-transformer');
        // tool-specific code
    }
}
```
**Location**: `shared/js/core/base-tool.js` (examine in workspace)

**2. Event-Driven Communication**
- Centralized event manager at `shared/js/core/events.js`
- Use `ToolShelf.Events.emit()` and `.on()` for cross-component communication
- Example: Analytics track tool usage through events

**3. Real-Time Processing with Debouncing**
- Input changes trigger debounced transformations (100ms delay)
- Prevent UI blocking while maintaining responsive feel
- **Utility**: `ToolShelf.Utils.debounce(func, 100)` in `shared/js/core/utils.js`

**4. State Persistence via localStorage**
- Auto-save user state (transformations, input text) per tool
- Restore on page reload via `BaseTool.importState()`
- **Pattern**: Serializable state objects only

---

## 3. Directory Structure & Conventions

### Tools Directory Pattern
Each tool folder (`json-formatter/`, `text-transformer/`, etc.) should follow:
```
tool-name/
├── index.html              # Master HTML with full doc meta, stylesheets, scripts
├── css/
│   └── style.css           # Tool-specific styles (import shared/*.css first)
└── js/
    └── main.js             # Tool initialization & exports class
```

### Blog Directory Pattern
```
blog/
├── index.html              # Blog home with sidebar + grid of posts
├── js/
│   ├── blog-config.js      # BLOG_CATEGORIES + blogPosts array (categorized)
│   ├── sidebar.js          # BlogSidebar class (renders category navigation)
│   ├── blog-home.js        # Blog page initialization
│   └── blog-post.js        # Individual post page navigation
└── css/
    └── blog.css            # Blog-specific styles
```

### Shared Assets Hierarchy
```
shared/
├── js/
│   ├── core/               # App-wide systems
│   │   ├── app.js          # ToolShelfApp controller
│   │   ├── events.js       # Event manager (emit/on)
│   │   ├── utils.js        # Debounce, throttle, format utilities
│   │   └── ...
│   ├── components/         # Reusable UI (toast, keyboard, navigation)
│   └── tools/              # Base class for all tools
├── css/
│   ├── variables.css       # Design tokens (colors, spacing, fonts)
│   ├── base.css            # Reset, typography, foundational styles
│   ├── components.css      # Reusable UI component styles
│   └── layout.css          # Grid systems, positioning
└── config/
    └── constants.js        # App-wide configuration
```

---

## 4. Coding Conventions & Patterns

### JavaScript Patterns

**Namespace Approach** (not modules—no import/export at tool level)
```javascript
// In tool main.js, attach to global ToolShelf:
window.ToolShelf = window.ToolShelf || {};
window.ToolShelf.MyTool = class MyTool extends ToolShelf.BaseTool {
    // class body
};
```

**Event Naming Convention**
```javascript
// Events follow: toolName:action
ToolShelf.Events.emit('text-transformer:case-changed', { case: 'uppercase' });
ToolShelf.Events.on('analytics:track', (event) => { /* log */ });
```

**DOM Selectors: Data Attributes**
```html
<!-- Use data-* attributes for tool-specific selectors -->
<button data-transform="uppercase">Uppercase</button>
<textarea data-input-area></textarea>
```
```javascript
document.querySelector('[data-transform="uppercase"]');
```

**Performance Rule: Debounce Input Events**
```javascript
const debouncedTransform = ToolShelf.Utils.debounce(() => {
    this.updateOutput();
}, 100);
inputElement.addEventListener('input', debouncedTransform);
```

### CSS Conventions

**Custom Properties (Design Tokens)**
```css
/* All colors, spacing in variables.css */
var(--color-primary)      /* #3b82f6 */
var(--spacing-unit)       /* 8px base unit */
var(--font-mono)          /* monospace font */
```

**BEM Naming for Components**
```css
.tool-container { }
.tool-container__input { }
.tool-container__input--focused { }
```

**Mobile-First Responsive**
```css
/* Base: mobile styles */
.section { width: 100%; }

/* Medium screens and up */
@media (min-width: 768px) {
    .section { display: grid; }
}
```

---

## 5. Active Development Tasks

### Task 1: Blog Sidebar Categorization (In Progress)
**Goal**: Restructure blog as category-filtered documentation hub

**Status**: `blog-config.js` already has:
- ✅ `BLOG_CATEGORIES` array (devops, backend, frontend, security, ai, cs)
- ✅ All `blogPosts` have `category` property assigned
- ✅ `sidebar.js` class renders category accordion

**Next Steps** (from plan.md):
1. ✅ Step 1: Data structure categorized (DONE)
2. ⏳ Step 3: Redesign blog home (CSS Grid: 280px sidebar | 1fr content)
3. ⏳ Step 4: Make sidebar sticky on scroll, mobile-responsive (drawer)
4. 📝 Step 5: Update individual blog post HTML with `<aside>` tag

**Files to Edit**:
- `blog/index.html`—Add two-column grid layout
- `blog/css/blog-sidebar.css`—Sticky positioning, mobile drawer
- Individual post HTML files—Add `<aside>` container

### Task 2: JSON Formatter Enhancements (Pending)
**Goal**: Add resizable text areas + optional syntax highlighting

**Features to Add**:
1. **Resizable Text Areas**: Drag border between input/output to resize
2. **Syntax Highlighting**: Prism.js or highlight.js (configurable toggle)

**Key File**: `json-formatter/index.html` (806 lines)

**Pattern to Follow**:
- Add UI toggle for syntax highlighting in tool settings
- Store preference in localStorage via `BaseTool.exportState()`
- Use event delegation for resize handle interactions

---

## 6. Critical Workflows & Commands

### No Build Process
This is vanilla JS—**no npm, no webpack, no bundler**.
- **Development**: Just open `toolshelf/index.html` in browser
- **Testing**: Manual testing in browser; no test runner
- **Deployment**: Commit `.html`, `.js`, `.css` files directly

### Git & Deployment
```bash
git clone https://github.com/mir-shakir/ToolShelf.git
cd ToolShelf
# Open toolshelf/index.html in browser
git commit -am "Add feature"
git push origin main
# Site deploys automatically (Netlify or similar)
```

### File Navigation
- Main entry: `toolshelf/index.html`
- Tool pages: `toolshelf/[tool-name]/index.html`
- Blog: `toolshelf/blog/index.html`
- Shared styles: `toolshelf/shared/css/` (loaded globally)
- Shared JS: `toolshelf/shared/js/` (namespaced under `ToolShelf`)

### Debugging
- **Browser DevTools**: Console logs prefixed with emoji (🚀, 📡, 🛠️, ❌)
- **localStorage**: `localStorage.getItem('toolshelf:TEXT_TRANSFORMER_STATE')`
- **Events**: Trace with `ToolShelf.Events.on('*:*', console.log)`

---

## 7. Integration Points & Cross-Tool Communication

### Adding a New Tool
1. **Create folder**: `toolshelf/new-tool/`
2. **Create HTML**: Import `shared/css/variables.css`, `base.css`, `layout.css`
3. **Create JS class**: Extend `ToolShelf.BaseTool`
4. **Register in app**: Edit `shared/js/core/app.js` `initializeTools()` method
5. **Add to navigation**: Update `shared/js/components/navigation.js`

### Blog-Homepage Relationship
- Blog posts defined in `blog/js/blog-config.js` (single source of truth)
- `blog/js/blog-home.js` renders grid with category filters
- `blog/js/blog-post.js` renders individual post + nav (prev/next)
- Sidebar (`blog/js/sidebar.js`) shared between home and post pages

### Toast Notifications
```javascript
// Use global toast system (DON'T create custom alerts)
ToolShelf.Toast.success('JSON formatted successfully');
ToolShelf.Toast.error('Invalid JSON: ' + error.message);
```

---

## 8. Performance & Offline Requirements

- **No external API calls** except blog image CDN (Supabase)
- **Offline-first**: All tools work without internet; blog images fail gracefully
- **Bundle Size**: Minimal—no frameworks, no heavy dependencies
- **Lazy Load**: Consider lazy-loading blog post thumbnails
- **Keyboard Shortcuts**: All keyboard handlers in `shared/js/components/keyboard.js`

---

## 9. Code Quality

- **Documentation**: JSDoc comments for public methods
- **Error Handling**: Catch errors, log to console, show toast to user
- **Accessibility**: WCAG 2.1 AA—keyboard navigation, semantic HTML, ARIA labels
- **Mobile**: Responsive CSS; test on 375px (mobile), 768px (tablet), 1200px (desktop)

---

## 10. References & Key Files

| File | Purpose |
|------|---------|
| `project-snapshot.md` | Detailed architecture & design decisions |
| `shared/js/core/app.js` | Main app controller |
| `shared/js/core/events.js` | Event manager |
| `blog/js/blog-config.js` | Blog data & categories |
| `blog/js/sidebar.js` | Sidebar component |
| `.github/plan.md` | Active development tasks |
