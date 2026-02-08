# TASK: Implement Categorized Blog Sidebar & Layout Restructure

## 1. Strategic Goal
The current blog homepage is a flat list of random articles. We need to restructure the blog section into a professional **Documentation/Knowledge Base layout**.
**Key Features:**
* **Persistent Sidebar:** Visible on the Blog Home AND all individual Blog Posts.
* **Categorization:** Group posts by topic (e.g., "Backend", "Frontend", "Security").
* **Expandable Nav:** Accordion-style menu in the sidebar.

## 2. Technical Implementation Steps

### Step 1: Update Data Structure (`toolshelf/blog/js/blog-config.js`)
* Analyze the existing `blogPosts` array.
* Add a new `category` property to every post object.
* **Infer the category** based on the existing `tags` or `title`. Use these standard buckets:
    * **Backend Engineering** (Java, Kafka, Redis, SQL)
    * **Frontend & UI** (CSS, JavaScript, React, UX)
    * **DevOps & Security** (Docker, Kubernetes, Auth, SSL)
    * **AI & Emerging Tech** (LLMs, UUID v7, Tools)
    * **Career & Soft Skills** (Glue Engineers, Management)

### Step 2: Create the Sidebar Component (`toolshelf/blog/js/sidebar.js`)
Create a class `BlogSidebar` that:
1.  **Groups Data:** Iterates over `blogPosts` and groups them by `category`.
2.  **Renders HTML:** Generates an accordion UI.
    * Header: Category Name (Clickable to toggle).
    * Body: List of links to posts in that category.
    * *State:* If the user is on a specific post, the corresponding category should be **expanded** and the current post **highlighted** automatically.
3.  **Injects:** Finds `#blog-sidebar-container` and populates it.

### Step 3: Redesign Blog Home (`toolshelf/blog/index.html`)
* Change the main container to a **CSS Grid** layout (`280px 1fr`).
* **Left Column:** `<aside id="blog-sidebar-container"></aside>`
* **Right Column:** The existing post grid (but filtered).
    * *Change:* Instead of a random list, show "Latest Articles" at the top, followed by "Browse by Category" sections.

### Step 4: Styles (`toolshelf/blog/css/blog-sidebar.css`)
* **Sticky Position:** The sidebar must stick to the viewport top as the user scrolls down long articles.
* **Mobile Responsiveness:** On mobile, the sidebar should become a collapsible "Topics" dropdown at the top of the page, or a slide-out drawer. Do NOT just stack it at the very bottom.

## 3. Execution Instructions
1.  **Refactor `blog-config.js`** first to add categories.
2.  **Create `sidebar.js`** and the CSS.
3.  **Update `index.html`** to use the new 2-column layout.
4.  **Instruction for me:** Tell me exactly where to add the `<aside>` tag in my individual blog post HTML files so I can update them (or write a script to update them if you can).

**Go ahead and start with Step 1: Categorizing the data.**