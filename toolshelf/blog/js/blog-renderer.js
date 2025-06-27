/**
 * ToolShelf Blog - Content Renderer
 * Handles markdown rendering, syntax highlighting, and content enhancements
 */

class BlogContentRenderer {
    constructor() {
        this.init();
    }

    init() {
        // Initialize markdown renderer
        this.setupMarkdownRenderer();

        // Setup syntax highlighting
        this.setupSyntaxHighlighting();

        console.log('✅ Blog Content Renderer initialized');
    }

    /**
     * Setup markdown renderer with extensions
     */
    setupMarkdownRenderer() {
        // For now, we'll use a simple markdown parser
        // You can replace this with marked.js or similar library
        this.markdownRenderer = {
            render: (content) => this.parseMarkdown(content)
        };
    }

    /**
     * Setup syntax highlighting
     */
    setupSyntaxHighlighting() {
        // Prism.js is already loaded in the HTML
        if (window.Prism) {
            // Auto-highlight all code blocks
            Prism.highlightAll();

            // Setup line numbers
            Prism.plugins.lineNumbers = true;
        }
    }

    /**
     * Simple markdown parser (basic implementation)
     * In production, use marked.js or similar
     */
    parseMarkdown(content) {
        if (!content) return '';

        // Convert markdown to HTML
        let html = content
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')

            // Bold and Italic
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')

            // Code blocks
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang || 'javascript';
                return `<pre><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>`;
            })

            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')

            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

            // Lists
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

            // Paragraphs
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')

            // Clean up empty paragraphs
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6]>)/g, '$1')
            .replace(/(<\/h[1-6]>)<\/p>/g, '$1');

        return html;
    }

    /**
     * Render full article content
     */
    renderArticleContent(article) {
        const content = this.parseMarkdown(article.content);

        // Add table of contents if available
        const toc = this.generateTableOfContents(content);

        // Add reading progress indicator
        const progressHTML = this.generateReadingProgress();

        // Add article navigation
        const navigationHTML = this.generateArticleNavigation(article);

        return `
            ${progressHTML}
            <article class="blog-article">
                <header class="article-header">
                    <div class="article-meta">
                        <span class="article-category">${article.category}</span>
                        <time datetime="${article.published_at}">${this.formatDate(article.published_at)}</time>
                    </div>
                    <h1 class="article-title">${article.title}</h1>
                    <p class="article-excerpt">${article.excerpt}</p>
                    <div class="article-stats">
                        <span><i class="fas fa-clock"></i> ${article.reading_time || 5} min read</span>
                        <span><i class="fas fa-eye"></i> ${article.view_count || 0} views</span>
                        <span><i class="fas fa-signal"></i> ${this.capitalizeFirst(article.difficulty_level || 'intermediate')}</span>
                    </div>
                    <div class="article-tags">
                        ${article.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
                    </div>
                </header>
                
                ${toc ? `<nav class="table-of-contents">${toc}</nav>` : ''}
                
                <div class="article-content">
                    ${content}
                </div>
                
                <footer class="article-footer">
                    ${this.generateArticleFooter(article)}
                </footer>
            </article>
            
            ${navigationHTML}
        `;
    }

    /**
     * Generate table of contents
     */
    generateTableOfContents(content) {
        const headings = content.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/g);
        if (!headings || headings.length < 2) return null;

        const tocItems = headings.map(heading => {
            const level = heading.match(/<h([2-4])/)[1];
            const text = heading.replace(/<[^>]*>/g, '');
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            return {
                level: parseInt(level),
                text,
                id
            };
        });

        const tocHTML = tocItems.map(item => {
            const indent = (item.level - 2) * 20;
            return `<a href="#${item.id}" class="toc-item" style="margin-left: ${indent}px">${item.text}</a>`;
        }).join('');

        return `
            <div class="toc-header">
                <i class="fas fa-list"></i>
                Table of Contents
            </div>
            <div class="toc-items">
                ${tocHTML}
            </div>
        `;
    }

    /**
     * Generate reading progress indicator
     */
    generateReadingProgress() {
        return `
            <div class="reading-progress">
                <div class="reading-progress-bar" id="readingProgressBar"></div>
            </div>
        `;
    }

    /**
     * Generate article footer with sharing and related content
     */
    generateArticleFooter(article) {
        return `
            <div class="article-actions">
                <div class="share-buttons">
                    <span class="share-label">Share this article:</span>
                    <button class="share-btn twitter" onclick="shareArticle('twitter', '${article.slug}', '${article.title}')">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="share-btn linkedin" onclick="shareArticle('linkedin', '${article.slug}', '${article.title}')">
                        <i class="fab fa-linkedin"></i>
                    </button>
                    <button class="share-btn facebook" onclick="shareArticle('facebook', '${article.slug}', '${article.title}')">
                        <i class="fab fa-facebook"></i>
                    </button>
                    <button class="share-btn copy" onclick="copyArticleLink('${article.slug}')">
                        <i class="fas fa-link"></i>
                    </button>
                </div>
                
                <div class="article-feedback">
                    <span class="feedback-label">Was this helpful?</span>
                    <button class="feedback-btn positive" onclick="submitFeedback('${article.slug}', 'positive')">
                        <i class="fas fa-thumbs-up"></i>
                        <span class="feedback-count">${article.like_count || 0}</span>
                    </button>
                    <button class="feedback-btn negative" onclick="submitFeedback('${article.slug}', 'negative')">
                        <i class="fas fa-thumbs-down"></i>
                    </button>
                </div>
            </div>
            
            <div class="author-bio">
                <div class="author-avatar">
                    <img src="${article.author_avatar || '/assets/images/default-avatar.png'}" alt="${article.author_name}">
                </div>
                <div class="author-info">
                    <h4>${article.author_name || 'ToolShelf Team'}</h4>
                    <p>Backend developer with 3+ years of experience building scalable systems. 
                    Passionate about performance optimization and clean architecture.</p>
                </div>
            </div>
        `;
    }

    /**
     * Generate article navigation
     */
    generateArticleNavigation(article) {
        return `
            <nav class="article-navigation">
                <a href="/blog/" class="nav-back">
                    <i class="fas fa-arrow-left"></i>
                    Back to Blog
                </a>
                <div class="nav-related">
                    <h4>Related Articles</h4>
                    <div id="relatedArticles">
                        <!-- Will be populated by JavaScript -->
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Setup reading progress tracking
     */
    setupReadingProgress() {
        const progressBar = document.getElementById('readingProgressBar');
        if (!progressBar) return;

        const updateProgress = () => {
            const article = document.querySelector('.article-content');
            if (!article) return;

            const articleTop = article.offsetTop;
            const articleHeight = article.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollTop = window.pageYOffset;

            const progress = Math.min(
                Math.max((scrollTop - articleTop + windowHeight) / articleHeight, 0),
                1
            );

            progressBar.style.width = `${progress * 100}%`;
        };

        window.addEventListener('scroll', updateProgress);
        updateProgress();
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Global functions for sharing and feedback
window.shareArticle = (platform, slug, title) => {
    const url = `${window.location.origin}/blog/${slug}/`;
    const text = `Check out this article: ${title}`;

    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    };

    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
};

window.copyArticleLink = (slug) => {
    const url = `${window.location.origin}/blog/${slug}/`;
    navigator.clipboard.writeText(url).then(() => {
        // Show toast notification
        if (window.ToolShelfBlog) {
            window.ToolShelfBlog.showToast('Article link copied to clipboard!', 'success');
        }
    });
};

window.submitFeedback = async (slug, type) => {
    try {
        // Here you would send feedback to your backend
        console.log(`Feedback for ${slug}: ${type}`);

        // Show thank you message
        if (window.ToolShelfBlog) {
            window.ToolShelfBlog.showToast('Thank you for your feedback!', 'success');
        }
    } catch (error) {
        console.error('Failed to submit feedback:', error);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.BlogContentRenderer = new BlogContentRenderer();
});