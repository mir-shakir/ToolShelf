/**
 * ToolShelf Blog - Static Site Generator
 * Generates static HTML files for each article with proper SEO
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');

class BlogStaticGenerator {
    constructor() {
        this.supabase = null;
        this.articles = [];
        this.categories = [];
        this.outputDir = './'; // This should be BLOG directory only
        this.templateDir = './templates';

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Starting ToolShelf Blog static generation...');
            
            // Initialize Supabase
            this.initSupabase();
            
            // Setup marked with syntax highlighting
            this.setupMarkdown();
            
            // Load data
            await this.loadArticles();
            await this.loadCategories();
            
            // Generate pages
            await this.generateArticlePages();
            await this.generateBlogIndex();
            await this.generateCategoryPages();
            await this.generateSitemap();
            await this.generateRSSFeed();
            
            console.log('✅ Static generation completed successfully!');
            console.log(`📄 Generated ${this.articles.length} article pages`);
            console.log(`📁 Generated ${this.categories.length} category pages`);
            
        } catch (error) {
            console.error('❌ Static generation failed:', error);
            process.exit(1);
        }
    }

    initSupabase() {
        const supabaseUrl = process.env.SUPABASE_URL || 'https://hcqhtcngwqeqvlwybvyq.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
        }
        
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Supabase client initialized');
    }

    setupMarkdown() {
        const renderer = new marked.Renderer();

        // Custom image renderer with lazy loading and responsive design
        renderer.image = function (href, title, text) {
            const titleAttr = title ? ` title="${title}"` : '';
            return `
                <figure class="article-image">
                    <img src="${href}" alt="${text}"${titleAttr} loading="lazy" class="responsive-image">
                    ${title ? `<figcaption>${title}</figcaption>` : ''}
                </figure>
            `;
        };

        marked.setOptions({
            renderer: renderer,
            highlight: function (code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.warn(`Highlighting failed for language: ${lang}`);
                    }
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });
    }

    async loadArticles() {
        const { data: articles, error } = await this.supabase
            .from('articles')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to load articles: ${error.message}`);
        }

        this.articles = articles || [];
        console.log(`✅ Loaded ${this.articles.length} published articles`);
    }

    async loadCategories() {
        const { data: categories, error } = await this.supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) {
            console.warn('No categories table found, using default categories');
            this.categories = this.getDefaultCategories();
        } else {
            this.categories = categories || [];
        }

        console.log(`✅ Loaded ${this.categories.length} categories`);
    }

    getDefaultCategories() {
        return [
            { name: 'Backend Development', slug: 'backend', description: 'Server-side development, APIs, databases' },
            { name: 'Database Systems', slug: 'database', description: 'Database design, optimization, analytics' },
            { name: 'Microservices', slug: 'microservices', description: 'Distributed systems architecture' },
            { name: 'Developer Tools', slug: 'tools', description: 'Productivity tools and development utilities' },
            { name: 'Performance', slug: 'performance', description: 'Optimization and scaling techniques' },
            { name: 'Architecture', slug: 'architecture', description: 'System design and software architecture' }
        ];
    }

    async generateArticlePages() {
        console.log('📄 Generating individual article pages...');
        
        for (const article of this.articles) {
            await this.generateArticlePage(article);
        }
    }

    async generateArticlePage(article) {
        try {
            // Create article directory
            const articleDir = path.join(this.outputDir, article.slug);
            await this.ensureDir(articleDir);
            
            // Generate HTML content
            const html = await this.renderArticleHTML(article);
            
            // Write index.html file
            const filePath = path.join(articleDir, 'index.html');
            await fs.writeFile(filePath, html, 'utf8');
            
            console.log(`  ✅ Generated: /${article.slug}/`);
            
        } catch (error) {
            console.error(`  ❌ Failed to generate article: ${article.slug}`, error);
        }
    }

    async renderArticleHTML(article) {
        const template = await this.loadTemplate('article.html');
        
        // Process markdown content
        const contentHTML = marked(article.content || '');
        
        // Generate table of contents
        const toc = this.generateTableOfContents(contentHTML);

        const finalContent = this.updatedContent || contentHTML;
        
        // Get related articles
        const relatedArticles = this.getRelatedArticles(article);
        
        // Calculate reading time if not set
        const readingTime = article.reading_time || this.calculateReadingTime(article.content);
        
        // Format date
        const publishedDate = new Date(article.published_at);
        const formattedDate = publishedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Replace template variables
        const html = template
            .replace(/\{\{ARTICLE_TITLE\}\}/g, this.escapeHtml(article.title))
            .replace(/\{\{ARTICLE_META_TITLE\}\}/g, this.escapeHtml(article.meta_title || article.title))
            .replace(/\{\{ARTICLE_META_DESCRIPTION\}\}/g, this.escapeHtml(article.meta_description || article.excerpt))
            .replace(/\{\{ARTICLE_KEYWORDS\}\}/g, (article.keywords || []).join(', '))
            .replace(/\{\{ARTICLE_URL\}\}/g, `https://toolshelf.onrender.com/blog/${article.slug}/`)
            .replace(/\{\{ARTICLE_SLUG\}\}/g, article.slug)
            .replace(/\{\{ARTICLE_CATEGORY\}\}/g, this.escapeHtml(article.category || ''))
            .replace(/\{\{ARTICLE_EXCERPT\}\}/g, this.escapeHtml(article.excerpt || ''))
            .replace(/\{\{ARTICLE_CONTENT\}\}/g, finalContent)
            .replace(/\{\{ARTICLE_TAGS\}\}/g, this.renderTags(article.tags))
            .replace(/\{\{ARTICLE_PUBLISHED_DATE\}\}/g, formattedDate)
            .replace(/\{\{ARTICLE_PUBLISHED_ISO\}\}/g, article.published_at)
            .replace(/\{\{ARTICLE_READING_TIME\}\}/g, readingTime)
            .replace(/\{\{ARTICLE_VIEW_COUNT\}\}/g, article.view_count || 0)
            .replace(/\{\{ARTICLE_DIFFICULTY\}\}/g, this.capitalizeFirst(article.difficulty_level || 'intermediate'))
            .replace(/\{\{ARTICLE_AUTHOR\}\}/g, this.escapeHtml(article.author_name || 'ToolShelf Team'))
            .replace(/\{\{ARTICLE_AUTHOR_AVATAR\}\}/g, article.author_avatar || '/assets/images/default-avatar.png')
            .replace(/\{\{TABLE_OF_CONTENTS\}\}/g, toc)
            .replace(/\{\{RELATED_ARTICLES\}\}/g, this.renderRelatedArticles(relatedArticles))
            .replace(/\{\{CURRENT_YEAR\}\}/g, new Date().getFullYear());
            
        return html;
    }

generateTableOfContents(content) {
    const headings = content.match(/<h[2-4][^>]*>(.*?)<\/h[2-4]>/g);
    if (!headings || headings.length < 2) return '';

    let updatedContent = content;
    const tocItems = headings.map((heading, index) => {
        const level = parseInt(heading.match(/<h([2-4])/)[1]);
        const text = heading.replace(/<[^>]*>/g, '');
        const id = `heading-${index + 1}`;
        
        // Add ID to the heading in content
        const headingWithId = heading.replace('>', ` id="${id}">`);
        updatedContent = updatedContent.replace(heading, headingWithId);
        
        return {
            level,
            text,
            id,
            indent: (level - 2) * 20
        };
    });

    const tocHTML = tocItems.map(item => 
        `<a href="#${item.id}" class="toc-item" style="margin-left: ${item.indent}px">${item.text}</a>`
    ).join('');

    // Update the content with IDs
    this.updatedContent = updatedContent;

    return `
        <nav class="table-of-contents">
            <div class="toc-header">
                <i class="fas fa-list"></i>
                Table of Contents
            </div>
            <div class="toc-items">
                ${tocHTML}
            </div>
        </nav>
    `;
};
    

    getRelatedArticles(currentArticle, limit = 3) {
        return this.articles
            .filter(article => article.id !== currentArticle.id)
            .filter(article => {
                // Find articles with similar categories or tags
                const hasMatchingCategory = article.category === currentArticle.category;
                const hasMatchingTags = article.tags?.some(tag => 
                    currentArticle.tags?.includes(tag)
                );
                const hasMatchingTechStack = article.tech_stack?.some(tech => 
                    currentArticle.tech_stack?.includes(tech)
                );
                
                return hasMatchingCategory || hasMatchingTags || hasMatchingTechStack;
            })
            .slice(0, limit);
    }

    renderRelatedArticles(articles) {
        if (!articles.length) return '';

        const articlesHTML = articles.map(article => {
            const date = new Date(article.published_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            
            return `
                <a href="/blog/${article.slug}/" class="related-article">
                    <h5>${this.escapeHtml(article.title)}</h5>
                    <p>${this.escapeHtml(article.excerpt?.substring(0, 100) || '')}...</p>
                    <span class="related-date">${date}</span>
                </a>
            `;
        }).join('');

        return articlesHTML;
    }

    renderTags(tags) {
        if (!tags || !tags.length) return '';
        
        return tags.map(tag => 
            `<span class="tag">${this.escapeHtml(tag)}</span>`
        ).join('');
    }

    calculateReadingTime(content) {
        if (!content) return 5;
        
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }

 async generateBlogIndex() {
        console.log('📄 Generating blog index page...');
        
        const template = await this.loadTemplate('blog-index.html');
        
        // Get featured article
        const featuredArticle = this.articles.find(article => article.featured) || this.articles[0];
        
        // Get recent articles (excluding featured)
        const recentArticles = this.articles
            .filter(article => article.id !== featuredArticle?.id)
            .slice(0, 6);
        
        // Calculate stats
        const totalViews = this.articles.reduce((sum, article) => sum + (article.view_count || 0), 0);
        
        const html = template
            .replace(/\{\{TOTAL_ARTICLES\}\}/g, this.articles.length)
            .replace(/\{\{TOTAL_VIEWS\}\}/g, this.formatNumber(totalViews))
            .replace(/\{\{FEATURED_ARTICLE\}\}/g, featuredArticle ? this.renderFeaturedArticle(featuredArticle) : '')
            .replace(/\{\{RECENT_ARTICLES\}\}/g, this.renderArticleCards(recentArticles))
            .replace(/\{\{CURRENT_YEAR\}\}/g, new Date().getFullYear());
            
        // FIX: Write to blog/index.html, NOT root index.html
        await fs.writeFile(path.join(this.outputDir, 'index.html'), html, 'utf8');
        console.log('  ✅ Generated: /blog/index.html');  // Updated log message
    }


    renderFeaturedArticle(article) {
        const date = new Date(article.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <article class="featured-article" onclick="window.location.href='/blog/${article.slug}/'">
                <div class="featured-meta">
                    <span class="featured-category">${this.escapeHtml(article.category || '')}</span>
                    <span class="featured-date">${date}</span>
                </div>
                <h2 class="featured-title">${this.escapeHtml(article.title)}</h2>
                <p class="featured-excerpt">${this.escapeHtml(article.excerpt || '')}</p>
                <div class="featured-stats">
                    <span><i class="fas fa-clock"></i> ${article.reading_time || 5} min read</span>
                    <span><i class="fas fa-eye"></i> ${this.formatNumber(article.view_count || 0)} views</span>
                    <span><i class="fas fa-signal"></i> ${this.capitalizeFirst(article.difficulty_level || 'intermediate')}</span>
                    <span><i class="fas fa-calendar"></i> ${date}</span>
                </div>
            </article>
        `;
    }

    renderArticleCards(articles) {
        return articles.map(article => {
            const date = new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const categoryInfo = this.getCategoryInfo(article.category);

            return `
                <article class="article-card" onclick="window.location.href='/blog/${article.slug}/'">
                    <div class="article-header">
                        <div class="article-meta">
                            <span class="article-category">
                                <i class="${categoryInfo.icon}"></i>
                                ${this.escapeHtml(article.category || '')}
                            </span>
                            <span class="article-date">${date}</span>
                        </div>
                        <h2 class="article-title">${this.escapeHtml(article.title)}</h2>
                        <p class="article-excerpt">${this.escapeHtml(article.excerpt || '')}</p>
                        <div class="article-tags">
                            ${this.renderTags(article.tags)}
                        </div>
                    </div>
                    <div class="article-footer">
                        <div class="article-stats">
                            <span class="article-stat">
                                <i class="fas fa-clock"></i>
                                ${article.reading_time || 5} min
                            </span>
                            <span class="article-stat">
                                <i class="fas fa-eye"></i>
                                ${this.formatNumber(article.view_count || 0)}
                            </span>
                            ${article.difficulty_level ? `
                                <span class="article-stat">
                                    <i class="fas fa-signal"></i>
                                    ${this.capitalizeFirst(article.difficulty_level)}
                                </span>
                            ` : ''}
                        </div>
                        <span class="read-more">
                            Read More
                            <i class="fas fa-arrow-right"></i>
                        </span>
                    </div>
                </article>
            `;
        }).join('');
    }

    getCategoryInfo(category) {
        const categoryMap = {
            'Backend Development': { icon: 'fas fa-server' },
            'Database Systems': { icon: 'fas fa-database' },
            'Microservices': { icon: 'fas fa-cubes' },
            'Developer Tools': { icon: 'fas fa-tools' },
            'Performance': { icon: 'fas fa-tachometer-alt' },
            'Architecture': { icon: 'fas fa-sitemap' }
        };
        
        return categoryMap[category] || { icon: 'fas fa-file-alt' };
    }

    async generateCategoryPages() {
        console.log('📁 Generating category pages...');
        
        for (const category of this.categories) {
            await this.generateCategoryPage(category);
        }
    }

    async generateCategoryPage(category) {
        try {
            // Create category directory
            const categoryDir = path.join(this.outputDir, 'category', category.slug);
            await this.ensureDir(categoryDir);
            
            // Get articles for this category
            const categoryArticles = this.articles.filter(article => 
                article.category?.toLowerCase().replace(/\s+/g, '-') === category.slug ||
                article.tags?.some(tag => tag.toLowerCase() === category.slug)
            );
            
            const template = await this.loadTemplate('category.html');
            
            const html = template
                .replace(/\{\{CATEGORY_NAME\}\}/g, this.escapeHtml(category.name))
                .replace(/\{\{CATEGORY_DESCRIPTION\}\}/g, this.escapeHtml(category.description || ''))
                .replace(/\{\{CATEGORY_ARTICLES_COUNT\}\}/g, categoryArticles.length)
                .replace(/\{\{CATEGORY_ARTICLES\}\}/g, this.renderArticleCards(categoryArticles))
                .replace(/\{\{CURRENT_YEAR\}\}/g, new Date().getFullYear());
                
            const filePath = path.join(categoryDir, 'index.html');
            await fs.writeFile(filePath, html, 'utf8');
            
            console.log(`  ✅ Generated: /category/${category.slug}/`);
            
        } catch (error) {
            console.error(`  ❌ Failed to generate category: ${category.slug}`, error);
        }
    }

    async generateSitemap() {
        console.log('🗺️ Generating sitemap...');

        const baseURL = 'https://toolshelf.onrender.com';
        const now = new Date().toISOString();

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseURL}/blog/</loc>
        <lastmod>${now}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>`;

        // Add article URLs
        for (const article of this.articles) {
            const lastmod = new Date(article.updated_at || article.published_at).toISOString();
            sitemap += `
    <url>
        <loc>${baseURL}/blog/${article.slug}/</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
        }

        // Add category URLs
        for (const category of this.categories) {
            sitemap += `
    <url>
        <loc>${baseURL}/blog/category/${category.slug}/</loc>
        <lastmod>${now}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>`;
        }

        sitemap += '\n</urlset>';

        await fs.writeFile(path.join(this.outputDir, 'sitemap.xml'), sitemap, 'utf8');
        console.log('  ✅ Generated: /blog/sitemap.xml');
    }

    async generateRSSFeed() {
        console.log('📡 Generating RSS feed...');

        const baseURL = 'https://toolshelf.onrender.com';
        const recentArticles = this.articles.slice(0, 20);

        let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>ToolShelf Blog - Backend Development Insights</title>
        <description>Deep-dive technical articles on ClickHouse, Kafka, microservices, and backend development</description>
        <link>${baseURL}/blog/</link>
        <atom:link href="${baseURL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
        <language>en-US</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

        for (const article of recentArticles) {
            const pubDate = new Date(article.published_at).toUTCString();
            rss += `
        <item>
            <title><![CDATA[${article.title}]]></title>
            <description><![CDATA[${article.excerpt || ''}]]></description>
            <link>${baseURL}/blog/${article.slug}/</link>
            <guid isPermaLink="true">${baseURL}/blog/${article.slug}/</guid>
            <pubDate>${pubDate}</pubDate>
            <category><![CDATA[${article.category || ''}]]></category>
        </item>`;
        }

        rss += `
    </channel>
</rss>`;

        await fs.writeFile(path.join(this.outputDir, 'feed.xml'), rss, 'utf8');
        console.log('  ✅ Generated: /blog/feed.xml');
    }

    async loadTemplate(templateName) {
        const templatePath = path.join(this.templateDir, templateName);
        
        try {
            return await fs.readFile(templatePath, 'utf8');
        } catch (error) {
            console.error(`❌ Failed to load template: ${templateName}`);
            throw error;
        }
    }

    async ensureDir(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Run the generator
if (require.main === module) {
    new BlogStaticGenerator();
}

module.exports = BlogStaticGenerator;