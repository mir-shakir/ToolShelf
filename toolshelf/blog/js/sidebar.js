// /blog/js/sidebar.js
import { blogPosts, BLOG_CATEGORIES } from './blog-config.js';

/**
 * BlogSidebar — Renders categorized navigation in two modes:
 *   - 'home': Compact category-only list for filtering (blog home sidebar column)
 *   - 'post': Collapsible inline panel with categories + post links (blog post pages)
 */
export class BlogSidebar {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.currentSlug = options.currentSlug || null;
        this.mode = options.mode || 'home';
        this.onCategoryClick = null;

        if (!this.container) return;
        this.render();
    }

    /** Groups blogPosts by category, sorted by BLOG_CATEGORIES order. */
    groupByCategory() {
        const groups = new Map();
        BLOG_CATEGORIES
            .sort((a, b) => a.order - b.order)
            .forEach(cat => groups.set(cat.key, { ...cat, posts: [] }));

        blogPosts.forEach(post => {
            const key = post.category || 'ai';
            if (groups.has(key)) {
                groups.get(key).posts.push(post);
            }
        });
        return groups;
    }

    render() {
        if (this.mode === 'home') {
            this._renderHome();
        } else {
            this._renderPost();
        }
    }

    /**
     * Home mode: Compact category-only buttons inside a collapsible <details>.
     * Categories act as filter toggles for the blog grid.
     */
    _renderHome() {
        const groups = this.groupByCategory();

        let html = `<details class="sidebar-collapsible" open>`;
        html += `<summary class="blog-sidebar-title"><i class="fas fa-layer-group"></i> Browse Topics</summary>`;
        html += `<nav class="sidebar-category-list" aria-label="Blog categories">`;

        groups.forEach((group, key) => {
            if (group.posts.length === 0) return;
            html += `<button class="sidebar-category-btn" data-category="${key}" type="button">`;
            html += `<span class="sidebar-category-icon">${group.icon}</span>`;
            html += `<span class="sidebar-category-label">${group.label}</span>`;
            html += `<span class="sidebar-category-count">${group.posts.length}</span>`;
            html += `</button>`;
        });

        html += `</nav></details>`;
        this.container.innerHTML = html;

        this.container.querySelectorAll('.sidebar-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.onCategoryClick) {
                    this.onCategoryClick(btn.dataset.category);
                }
            });
        });
    }

    /**
     * Post mode: Collapsible inline panel showing categories + post links.
     * Displayed as a horizontal bar above the article content.
     */
    _renderPost() {
        const groups = this.groupByCategory();

        let html = `<details class="blog-topics-panel">`;
        html += `<summary class="blog-topics-toggle">`;
        html += `<i class="fas fa-layer-group"></i> Browse Topics`;
        html += `<span class="toggle-hint">Click to explore all articles</span>`;
        html += `</summary>`;
        html += `<nav class="blog-topics-content" aria-label="Blog categories">`;

        groups.forEach((group, key) => {
            if (group.posts.length === 0) return;

            const isCurrentCategory = this.currentSlug &&
                group.posts.some(p => p.slug === this.currentSlug);
            const openAttr = isCurrentCategory ? ' open' : '';

            html += `<details class="topics-category" data-category="${key}"${openAttr}>`;
            html += `<summary class="topics-category-header">`;
            html += `<span class="sidebar-category-icon">${group.icon}</span>`;
            html += `<span class="sidebar-category-label">${group.label}</span>`;
            html += `<span class="sidebar-category-count">${group.posts.length}</span>`;
            html += `</summary>`;
            html += `<ul class="topics-post-list">`;

            group.posts.forEach(post => {
                const isActive = post.slug === this.currentSlug;
                const activeClass = isActive ? ' class="active"' : '';
                const href = `../${post.slug}/`;
                html += `<li${activeClass}><a href="${href}" title="${this._escapeHtml(post.title)}">${this._escapeHtml(post.title)}</a></li>`;
            });

            html += `</ul></details>`;
        });

        html += `</nav></details>`;
        this.container.innerHTML = html;
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /** Highlight a category button (home mode). */
    setActiveCategory(categoryKey) {
        this.container.querySelectorAll('.sidebar-category-btn').forEach(el => {
            el.classList.toggle('category-active', el.dataset.category === categoryKey);
        });
    }

    /** Clear all active highlights (home mode). */
    clearActiveCategory() {
        this.container.querySelectorAll('.sidebar-category-btn').forEach(el => {
            el.classList.remove('category-active');
        });
    }
}

/**
 * Factory — initializes sidebar and returns the instance.
 * @param {string} containerSelector - CSS selector for the container element
 * @param {Object} options - { mode: 'home'|'post', currentSlug: string|null }
 */
export function initBlogSidebar(containerSelector, options = {}) {
    return new BlogSidebar(containerSelector, options);
}
