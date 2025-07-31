# Blog Post Creation Manual

This document serves as a comprehensive guide and template for creating new blog posts on ToolShelf. It outlines the required HTML structure, metadata, and best practices for content formatting, including headings, lists, code blocks, and images.

## How to Create a New Blog Post

1.  **Create a New Directory:**
    *   Inside the `/blog/` directory, create a new folder for your blog post using a URL-friendly slug (e.g., `/blog/your-new-post-slug/`).
    *   Example: `/home/shakir/personal/code/github/ToolShelf/toolshelf/blog/your-new-post-slug/`

2.  **Create `index.html`:**
    *   Inside your new blog post directory, create an `index.html` file.
    *   Copy the entire content of this manual's HTML structure (from `<!DOCTYPE html>` to `</html>`) into your new `index.html` file.

3.  **Update Metadata in `<head>`:**
    *   **`<title>`:** Unique, descriptive title (e.g., "Your Awesome Blog Post Title – ToolShelf Blog").
    *   **`<meta name="title">`:** Same as `<title>`.
    *   **`<meta name="description">`:** A concise summary (under 160 characters) of your post's content.
    *   **`<link rel="canonical">`:** The absolute URL of your new post (e.g., `https://toolshelf.tech/blog/your-new-post-slug/`).
    *   **Open Graph & Twitter Cards (`og:`, `twitter:`):** Update `url`, `title`, `description`, and `image` properties. Use `../../assets/images/og-image-toolshelf.png` as a placeholder image if you don't have a specific one for the post.

4.  **Update Blog Post Header (`<header class="blog-post-header">`):**
    *   **`<h1 class="blog-post-title">`:** Your blog post's main title.
    *   **Date:** Update `<span><i class="fas fa-calendar-alt"></i> July 12, 2025</span>` to the actual publication date.
    *   **Read Time:** Update `<span><i class="fas fa-clock"></i> 5 min read</span>` to the estimated read time.
    *   **Tags:** Update the `<div class="blog-post-tags">` with relevant `<span class="tag-badge">Your Tag</span>` elements. These tags should also be added to `blog/js/blog-config.js`.

5.  **Add Your Content (`<div class="blog-post-content" id="articleContent">`):**
    *   Replace the placeholder content within this `div` with your actual blog post.
    *   **Headings:** Use `<h2>` for main sections and `<h3>` for sub-sections. Ensure each `<h2>` and `<h3>` has a unique `id` attribute for the Table of Contents (e.g., `<h2 id="your-section-title">`).
    *   **Paragraphs:** Use `<p>` tags for regular text.
    *   **Text Formatting:** Use `<strong>` for bold, `<em>` for italic, and `<code>` for inline code.
    *   **Blockquotes:** Use `<blockquote>` for quotes or call-out-notes.
    *   **Lists:** Use `<ul>` for unordered lists and `<ol>` for ordered lists, with `<li>` for list items.
    *   **Code Blocks:** Use `<pre><code class="language-javascript">...</code></pre>` for multi-line code. **Crucially, escape any HTML characters (like `<` or `>`) within your code blocks to prevent them from being rendered as HTML.** For example, `<` becomes `&lt;` and `>` becomes `&gt;`. Specify the language (e.g., `language-javascript`, `language-css`, `language-markup`, `language-bash`) for Prism.js syntax highlighting.
    *   **Images:** Use `<figure>` and `<img>` with `alt` text and an optional `<figcaption>`. All blog-related images should be placed in the `/blog/assets/images/` directory.
        *   **General Blog Post Images:** For images within the article content, use a width of `720px` (max-width of the article content) and optimize for web (e.g., JPEG, WebP).
        *   **Blog Post Card Thumbnails:** These are displayed on the blog homepage and related posts sections. They should be `1200x630px` (Open Graph standard) and use `object-fit: cover` for consistency.
        *   **Featured Article Image:** This is also `1200x630px` (Open Graph standard). The CSS uses `object-fit: contain` to ensure the entire image is visible, so ensure your image has appropriate padding or aspect ratio to look good within this constraint.
        *   Ensure image paths are correct relative to the blog post (e.g., `../../assets/images/your-image.png`).
    *   **Horizontal Rule:** Use `<hr>` for thematic breaks.

6.  **Update `blog/js/blog-config.js`:**
    *   Add a new object for your blog post to the `blogPosts` array in `blog/js/blog-config.js`.
    *   Ensure the `slug`, `title`, `excerpt`, `thumbnail`, `date`, `readTime`, and `tags` properties are accurate. The `slug` must match your directory name.

7.  **Update `sitemap.xml`:**
    *   Add a new `<url>` entry for your blog post, including `<loc>`, `<lastmod>`, `<changefreq>`, and `<priority>`.

8.  **Update `_redirects`:**
    *   Add a new redirect rule for your blog post to ensure clean URLs (e.g., `/blog/your-new-post-slug/index.html /blog/your-new-post-slug/ 301`).

## Blog Post Template HTML Structure (for reference)

```html
<main>
    <div class="blog-post-container">
        <aside class="toc-container" id="tocContainer">
            <h3>Table of Contents</h3>
            <ul class="toc-list" id="tocList"></ul>
        </aside>
        <article class="blog-post-article">
            <header class="blog-post-header">
                <h1 class="blog-post-title">Blog Post Template: A Guide to Content Components</h1>
                <div class="blog-post-meta">
                    <span>By The ToolShelf Team</span>
                    <span><i class="fas fa-calendar-alt"></i> July 12, 2025</span>
                    <span><i class="fas fa-clock"></i> 5 min read</span>
                </div>
                <div class="blog-post-tags">
                    <span class="tag-badge">Templates</span>
                    <span class="tag-badge">Guide</span>
                    <span class="tag-badge">ToolShelf</span>
                </div>
            </header>

            <div class="blog-post-content" id="articleContent">
                <p>This document serves as a live template for creating new blog posts on ToolShelf. It showcases all the available HTML components and their intended styling. Use this as a reference to ensure consistency and quality.</p>

                <h2 id="headings">Headings</h2>
                <p>Headings are crucial for structuring your content. Use H2 for main sections and H3 for sub-sections. H4 can be used for minor points if necessary.</p>
                <h3>This is a Sub-Heading (H3)</h3>
                <p>This paragraph falls under the H3 sub-heading, providing more detailed information.</p>
                <h4>This is a Minor Heading (H4)</h4>
                <p>This is a paragraph under an H4, useful for fine-grained topics.</p>

                <h2 id="text-formatting">Text Formatting</h2>
                <p>Basic text formatting is essential for emphasis. You can use <strong>bold text</strong> to highlight key terms, <em>italic text</em> for emphasis or definitions, and even combine them for <strong><em>strong emphasis</em></strong>. To reference a specific piece of code inline, use the `<code>` tag, for example: `const a = 10;`.</p>
                <p>Links are also a key part of any article. Here is a link to the <a href="https://toolshelf.tech">ToolShelf homepage</a>.</p>

                <h2 id="blockquotes">Blockquotes</h2>
                <p>Use blockquotes to call out important quotes or notes that need to stand apart from the main text.</p>
                <blockquote>"The art of programming is the art of organizing complexity, of mastering detail, and of structuring programs so that they are understandable to people."<br>- Edsger W. Dijkstra</blockquote>

                <h2 id="lists">Lists</h2>
                <p>Lists are perfect for organizing information. You can use unordered (bulleted) lists or ordered (numbered) lists.</p>
                <h3>Unordered List</h3>
                <ul>
                    <li>Item one: Can be a single point.</li>
                    <li>Item two: Or something more descriptive.</li>
                    <li>Item three: Can contain `inline code`.</li>
                </ul>
                <h3>Ordered List</h3>
                <ol>
                    <li>First, gather your requirements.</li>
                    <li>Second, design the system architecture.</li>
                    <li>Third, implement the solution.</li>
                </ol>

                <h2 id="code-blocks">Code Blocks</h2>
                <p>For longer code examples, use a pre-formatted code block. This ensures proper indentation, uses a monospace font, and provides a container for syntax highlighting.</p>
                <pre><code class="language-javascript">// Example JavaScript code block
function greet(name) {
  if (!name) {
    console.log("Hello, world!");
    return;
  }
  console.log(`Hello, ${name}!`);
}

// Usage:
greet("Developer"); // Output: Hello, Developer!
</code></pre>
                <p>Make sure to escape any HTML within the code block to prevent it from being rendered.</p>

                <h2 id="images">Images</h2>
                <p>Images can be used to illustrate points, show diagrams, or add visual interest. Ensure they are relevant and optimized for the web. An example is below.</p>
                <figure>
                    <img src="../../assets/images/og-image-toolshelf.png" alt="ToolShelf logo and branding image" style="width:100%; border-radius: 8px;">
                    <figcaption style="text-align: center; font-size: 0.9rem; color: var(--blog-meta-color); margin-top: 0.5rem;">Fig 1: The ToolShelf branding image.</figcaption>
                </figure>

                <h2 id="horizontal-rule">Horizontal Rule</h2>
                <p>To create a thematic break or separate distinct sections, you can use a horizontal rule.</p>
                <hr>
                <p>This text appears after the horizontal rule, indicating a new section or a shift in topic.</p>
            </div>
            <div class="blog-post-navigation">
                <a href="#" id="prevPostLink" class="nav-link-post prev-post hidden">
                    <i class="fas fa-arrow-left"></i>
                    <span>Previous Post</span>
                    <span class="nav-post-title"></span>
                </a>
                <a href="#" id="nextPostLink" class="nav-link-post next-post hidden">
                    <span>Next Post</span>
                    <span class="nav-post-title"></span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>

            <section class="related-posts-section">
                <h2 class="section-title">Also Read</h2>
                <div class="related-posts-grid">
                    <!-- Related posts will be injected here by JavaScript -->
                </div>
            </section>
        </article>
    </div>
</main>
```