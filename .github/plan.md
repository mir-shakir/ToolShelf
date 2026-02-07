# TASK: "Gut Renovation" of the JSON Formatter UX

## 1. The Strategic Intent ("The Why")
You are acting as a Senior Frontend UX Engineer. We are completely overhauling the existing `json-formatter` tool.

**The Problem:** The current design is failing our users. It prioritizes "SEO text" and branding headers above the fold, pushing the actual working area too far down. The input/output boxes are too small for real-world, large JSON payloads. The tool feels cramped and unusable for serious work.

**The Goal:** Shift from an "article-based" layout to an **"IDE-based" layout**.
Usability is now the #1 priority. We must maximize screen real estate for code. The tool should feel like a lightweight code editor—clean, spacious, and efficient.

## 2. The New UX Blueprint ("The What")

We are abandoning the current top-down layout. You have freedom to redesign the HTML structure of `toolshelf/json-formatter/index.html` and completely rewrite its CSS.

### The New Layout Structure (Split-Pane View)
1.  **Slim App Header:** The main site navigation (ToolShelf logo, Home, Blog links) must be compacted into a very slim top bar to save vertical space.
2.  **The Toolbar:** Directly below the slim header, create a horizontal toolbar containing the primary actions:
    * Left side: "Format", "Minify", "Validate".
    * Right side: "Copy Output", "Download", "Clear All".
3.  **The Editor Workspace (The Core):**
    * Below the toolbar, take up **all remaining vertical screen space**.
    * Create a **Split-Pane Layout**: Input (left) and Output (right) sitting side-by-side on desktop.
    * **Independently Scrollable:** The left pane and right pane must scroll independently. If I paste a 5,000-line JSON on the left, I shouldn't lose sight of the start of the output on the right.
    * **Maximized Area:** The textareas should have minimal padding and borders to maximize space for text.
4.  **The Footer/SEO:** The large "What is JSON?" text block currently at the top must be moved to the very bottom of the page, below the editors, in a footer section. It is secondary content now.

### Improved Interactions
* **Error Handling:** If validation fails, do NOT just show a toast notification. Display a prominent error banner directly above or below the Input textarea showing the specific error message and, if possible, the line number (e.g., *"Error: Unexpected token at line 45"*).
* **Mobile Responsiveness:** On smaller screens, the split-pane must stack vertically (Input on top, Output below), but still maximize available height.

## 3. Technical Execution & Constraints

* **Target Files:**
    * `toolshelf/json-formatter/index.html` (Major structural changes expected).
    * `toolshelf/json-formatter/css/json-styles.css` (Complete rewrite expected).
    * `toolshelf/json-formatter/js/json-formatter.js` & `json-ui-handlers.js` (Update as needed to support the new UI structure, e.g., new button IDs).
* **Stack:** Stick to vanilla JavaScript and CSS. Do not introduce external code editor libraries (like Monaco or Ace) yet. We want to achieve this "editor feel" using clever CSS grid/flexbox and resilient textareas first.
* **Styling:** Use the existing CSS variables (`var(--primary-color)`, `var(--background-secondary)`, etc.) to ensure it still feels like part of ToolShelf, just a "pro" version of it.

## 4. Freedom to Act
You have permission to make radical changes to the HTML structure and CSS of the `json-formatter` directory to achieve this "IDE feel." Look at modern code editors (VS Code) for inspiration on layout density and toolbar placement.

**Go ahead and propose the restructured HTML and the new CSS for this overhaul.**