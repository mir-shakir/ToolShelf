# TASK: Build the "Massive Mock Data Generator" (The Mockaroo Alternative)

## 1. Strategic Intent ("The Why")
You are a Product Engineer building a high-value tool for `toolshelf`.
**The Problem:** Developers need dummy data (SQL/CSV/JSON) for testing. The market leader (Mockaroo) limits free users to 1,000 rows and charges for more.
**Our Solution:** A **Client-Side** generator. Since it runs in the user's browser, we have $0 server costs, allowing us to offer **Unlimited Rows** for free.
**The USP:** "Generate 100,000+ rows of SQL/JSON/CSV for free. 100% Private. No Signup."

## 2. Technical Architecture
* **Directory:** `toolshelf/mock-data-generator/`
* **External Library:** Use **Faker.js** via ES Module CDN.
    * Import URL: `https://esm.sh/@faker-js/faker@8.4.1`
    * *Note:* Use this exact ESM import so no build step is required.
* **Base Class:** Extend `window.ToolShelf.BaseTool`.

## 3. Feature Requirements

### A. The Schema Builder (Left Pane)
Create a dynamic list where users define their columns.
* **Rows:** Each row has:
    * `Field Name` (Input, e.g., "user_email")
    * `Type` (Dropdown: Name, Email, Phone, Date, UUID, City, Boolean, ID)
    * `Options` (Optional: e.g., if "Date", show "Format").
* **Actions:** "Add Field", "Remove Field", "Drag to Reorder" (nice to have, but simple Up/Down buttons work too).
* **Presets:** On load, populate with a default "User" schema (id, name, email, created_at) so the tool isn't empty.

### B. The Control Center (Top Bar)
* **Format Selector:** JSON, CSV, SQL (TableName input required if SQL selected).
* **Row Count:** A standard input or slider. Range: 1 to 100,000.
    * *Performance Note:* If > 10,000, show a warning: "Generating large datasets may freeze your browser for a few seconds."
* **Action:** Big "Generate & Download" button.
* **Preview:** A "Refresh Preview" button to show just the first 5 rows.

### C. The Output/Preview (Right Pane)
* Show a code editor view (textarea) displaying the **First 10 Rows** of the result.
* Do NOT try to display 100,000 rows in the DOM. Only preview the sample. The full data is for download only.

## 4. SEO & Content Strategy (Crucial)
You must design the `index.html` to aggressively target competitors' weaknesses.
* **Page Title:** `Free Mock Data Generator (Unlimited SQL, JSON, CSV) - ToolShelf`
* **Comparison Section (Bottom):** Create a "Why use this?" table:
    * **Competitors:** 1,000 row limit, Requires Signup, Data sent to server (Privacy Risk).
    * **ToolShelf:** **Unlimited** rows, **No** Signup, **100% Local** (Privacy Safe).
* **Keywords to Embed:** "mockaroo alternative", "generate 1 million rows sql", "dummy data generator free", "seed data generator".

## 5. Implementation Steps
Generate the following files:

1.  `toolshelf/mock-data-generator/index.html`:
    * The UI skeleton using the "Split Pane" layout (Schema Builder on Left, Preview on Right).
    * Include the comparison SEO section.
2.  `toolshelf/mock-data-generator/css/mock-tool.css`:
    * Style the schema rows to look like a clean grid.
    * Make the "Download" button prominent (Primary Color).
3.  `toolshelf/mock-data-generator/js/generator.js`:
    * The Logic Class. Import `faker` from the CDN.
    * Implement `generateJSON`, `generateCSV`, `generateSQL`.
    * *Optimization:* For huge datasets, build the string in chunks to avoid memory crashes.
4.  `toolshelf/mock-data-generator/js/ui.js`:
    * Handle adding/removing schema rows.
    * Handle the Preview vs Download logic.

## 6. Analytics Tracking
* `tool_usage` -> `action: generate`, `count: 5000`, `format: sql`.
* `tool_usage` -> `action: download`.

**Go ahead and write the code for these files.**