# TASK: Build the "UUID v7 Generator & Decoder" Tool

## 1. Project Context & Architecture
You are a Senior Frontend Engineer working on "ToolShelf" (toolshelf.tech), a suite of privacy-first, offline-capable developer tools. The codebase uses vanilla JavaScript (ES6+), semantic HTML5, and CSS variables for theming.

**Your Goal:** Create a new tool called **"UUID v7 Generator & Decoder"**.

**Existing Architecture to Respect:**
* **Base Class:** All tools extend `window.ToolShelf.BaseTool` (see `shared/js/tools/base-tool.js`).
* **Analytics:** We use `window.ToolShelf.Analytics` for tracking.
* **Styling:** Use the CSS variables defined in `shared/css/variables.css` (e.g., `--primary-color`, `--bg-secondary`, `--text-muted`).
* **Structure:** The tool must live in `/toolshelf/uuid-v7-generator/`.

## 2. The Strategic Intent ("The Why")
We are building this specific tool to capture a high-value niche: **Backend Engineers and Architects moving to UUID v7**.
* **SEO Goal:** Rank for "UUID v7 generator", "sortable UUID", and "decode UUID v7". We are NOT competing for generic "UUID generator" traffic.
* **User Persona:** A senior developer who knows that v4 UUIDs fragment database indexes and wants v7 for performance. They need to generate test data or debug an existing ID.
* **Differentiation:** Most tools just generate IDs. Our tool will **Decode** them (prove the timestamp works) and **Visualize** the bit structure.

## 3. Feature Requirements

### A. Core Functionality (The Generator)
* **Default State:** Generate a valid UUID v7 immediately on page load.
* **Copy Button:** Prominent button to copy the ID.
* **Bulk Generation:** A toggle or slider to generate 5, 10, or 50 IDs at once (useful for SQL seeds).
* **Format Options:**
    * Standard (hyphenated): `018e...`
    * Compact (no hyphens).
    * SQL List (quoted and comma-separated).

### B. The "Killer Feature" (The Decoder)
* **Input:** Allow users to paste *any* UUID v7.
* **Output:** Instantly extract and display the **Timestamp** (Date & Time) embedded in the ID.
* **Validation:** If they paste a v4 UUID, politely tell them "This looks like a random v4 UUID (no timestamp found)."

### C. The Visualizer (Educational)
* Show the UUID broken down into its parts with color coding:
    * `[Timestamp]` (48 bits) - Green
    * `[Ver]` (4 bits) - Blue
    * `[Random]` - Gray
* This reinforces that v7 is time-ordered.

### D. Analytics & Tracking
You must implement the following events using `window.ToolShelf.Analytics`:
1.  `tool_usage` -> `action: generate` (when regenerate is clicked).
2.  `tool_usage` -> `action: decode` (when a valid v7 is decoded).
3.  `tool_usage` -> `action: bulk_generate` (when bulk mode is used).
4.  `content_copied` -> `tool: uuid_v7`.

## 4. Technical Implementation Details

### Pure JS UUID v7 Implementation
Since we don't use external libraries, use this logic for generating v7:
* **Timestamp:** Current time in ms (48 bits).
* **Version:** `0111` (7).
* **Variant:** `10` (Variant 2).
* **Random:** Fill the rest with `crypto.getRandomValues`.

### File Structure
Create the following files:
1.  `toolshelf/uuid-v7-generator/index.html` (The UI skeleton).
2.  `toolshelf/uuid-v7-generator/css/uuid-tool.css` (Tool-specific styles).
3.  `toolshelf/uuid-v7-generator/js/uuid-generator.js` (The main class extending `BaseTool`).

## 5. Design Guidelines
* **Clean & Professional:** Use the existing card layout found in `json-formatter` or `base64-encoder`.
* **SEO Content:** The `index.html` must include a rich description section at the bottom explaining "Why UUID v7?" and linking to our blog post (`../blog/the-uuid-gotcha-that-burned-me/`).
* **Responsiveness:** Must work on mobile (stack the bulk controls).

## 6. Execution Instructions
1.  Analyze the existing `json-formatter` or `base64-encoder` to understand the DOM structure and class inheritance.
2.  Write the **HTML** first, ensuring proper meta tags for SEO.
3.  Write the **CSS** to handle the "Visualizer" color coding.
4.  Write the **JavaScript** class `UUIDTool`.

## 7. Internal Linking & Navigation Strategy (Crucial for SEO)
You must not only build the tool but also integrate it into the existing site ecosystem so users and search engines can find it.

**Required Updates:**

### A. Homepage Entry (`toolshelf/index.html`)
* Add a new **Tool Card** for the UUID Generator in the `#toolsGrid`.
* **Category:** Tag it under `security` and `encoding`.
* **Search Tags:** `uuid generator v7 v4 guid sortable unique id decoder`.
* **Badges:** Add a "New" badge to catch attention.

### B. Blog Cross-Linking (High SEO Value)
We need to drive traffic from our content to this tool.
* **Target File:** `toolshelf/blog/the-uuid-gotcha-that-burned-me/index.html`
* **Action:** Insert a prominent "Call to Action" (CTA) box at the very top (or just after the intro) of this blog post.
    * *Text:* "Need a valid UUID v7 right now? Use our free **UUID v7 Generator & Decoder**."
    * *Style:* Use a simple alert/info box style so it stands out.

### C. "Related Tools" Footer (`toolshelf/shared/js/core/render-related-tools.js`)
* Update the `TOOLS` array in this file to include the new UUID tool.
* This ensures links to the UUID generator appear automatically at the bottom of the JSON Formatter, Base64 Encoder, etc.
* **Config:**
    * `id`: 'uuid-generator'
    * `title`: 'UUID v7 Generator'
    * `icon`: 'fa-fingerprint' (or similar FontAwesome icon)
    * `url`: '../uuid-v7-generator/'
    * `description`: 'Generate and decode time-sortable UUIDs'
