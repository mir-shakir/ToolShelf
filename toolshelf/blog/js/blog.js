/**
 * ToolShelf Blog - Main JavaScript
 * Handles blog functionality, Supabase integration, and user interactions
 */

class ToolShelfBlog {
    constructor() {
        this.supabase = null;
        this.articles = [];
        this.filteredArticles = [];
        this.currentPage = 1;
        this.articlesPerPage = 6;
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.currentView = 'grid';
        this.searchQuery = '';

        this.init();
    }

    /**
     * Initialize the blog
     */
    async init() {
        try {
            // Initialize Supabase
            this.initSupabase();

            // Show loading spinner
            this.showLoading();

            // Load articles
            await this.loadArticles();

            // Setup event listeners
            this.setupEventListeners();

            // Update stats
            this.updateStats();

            // Hide loading spinner
            this.hideLoading();

            console.log('✅ ToolShelf Blog initialized successfully');
        } catch (error) {
            console.error('❌ Blog initialization failed:', error);
            this.showError('Failed to load blog. Please refresh the page.');
        }
    }

    /**
     * Initialize Supabase client
     */
    initSupabase() {
        const supabaseUrl = 'https://aciuuggnnwlcyvuzwyag.supabase.co'; // Replace with your URL
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjaXV1Z2dubndsY3l2dXp3eWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjgzOTksImV4cCI6MjA2NjI0NDM5OX0.kL_-YdCZYHoTcnncoVZoEbDim-XLdUn5F5Ggq3eHPLI'; // Replace with your anon key

        this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        if (!this.supabase) {
            throw new Error('Failed to initialize Supabase client');
        }
    }

    /**
     * Load articles from Supabase
     */
    async loadArticles() {
        try {
            const { data: articles, error } = await this.supabase
                .from('articles')
                .select('*')
                .eq('status', 'published')
                .order('published_at', { ascending: false });

            if (error) {
                throw error;
            }

            this.articles = articles || [];
            this.filteredArticles = [...this.articles];

            // Render articles
            this.renderArticles();
            this.renderFeaturedArticle();

            console.log(`✅ Loaded ${this.articles.length} articles`);
        } catch (error) {
            console.error('❌ Failed to load articles:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterAndSortArticles();
            });
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active filter
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                this.currentFilter = e.target.dataset.filter;
                this.currentPage = 1;
                this.filterAndSortArticles();
            });
        });

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.filterAndSortArticles();
            });
        }

        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                this.currentView = e.target.dataset.view;
                this.renderArticles();
            });
        });

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.currentPage++;
                this.renderArticles(true);
            });
        }

        // Newsletter form
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSignup(e);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Focus search with '/' key
            if (e.key === '/' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                searchInput?.focus();
            }
        });
    }

    /**
     * Filter and sort articles
     */
    filterAndSortArticles() {
        let filtered = [...this.articles];

        // Apply category filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(article =>
                article.category?.toLowerCase().replace(/\s+/g, '-') === this.currentFilter ||
                article.tags?.some(tag => tag.toLowerCase() === this.currentFilter)
            );
        }

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(article =>
                article.title?.toLowerCase().includes(this.searchQuery) ||
                article.excerpt?.toLowerCase().includes(this.searchQuery) ||
                article.tags?.some(tag => tag.toLowerCase().includes(this.searchQuery)) ||
                article.tech_stack?.some(tech => tech.toLowerCase().includes(this.searchQuery))
            );
        }

        // Apply sorting
        switch (this.currentSort) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
                break;
            case 'popular':
                filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
                break;
            case 'reading-time':
                filtered.sort((a, b) => (a.reading_time || 0) - (b.reading_time || 0));
                break;
        }

        this.filteredArticles = filtered;
        this.currentPage = 1;
        this.renderArticles();
    }

    /**
     * Render articles grid
     */
    renderArticles(append = false) {
        const grid = document.getElementById('articlesGrid');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        if (!grid) return;

        // Update grid class for view mode
        grid.className = `articles-grid ${this.currentView}-view`;

        const startIndex = (this.currentPage - 1) * this.articlesPerPage;
        const endIndex = startIndex + this.articlesPerPage;
        const articlesToShow = this.filteredArticles.slice(
            append ? 0 : startIndex,
            endIndex
        );

        if (!append) {
            grid.innerHTML = '';
        }

        if (articlesToShow.length === 0 && !append) {
            grid.innerHTML = this.renderEmptyState();
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        // Render articles
        const articlesHTML = articlesToShow.map(article => this.renderArticleCard(article)).join('');

        if (append) {
            grid.insertAdjacentHTML('beforeend', articlesHTML);
        } else {
            grid.innerHTML = articlesHTML;
        }

        // Setup article click handlers
        this.setupArticleClickHandlers();

        // Show/hide load more button
        if (loadMoreBtn) {
            const hasMore = endIndex < this.filteredArticles.length;
            loadMoreBtn.style.display = hasMore ? 'block' : 'none';
        }
    }

    /**
     * Render article card
     */
    renderArticleCard(article) {
        const publishedDate = new Date(article.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const categoryInfo = this.getCategoryInfo(article.category);
        const tagsHTML = article.tags?.slice(0, 3).map(tag =>
            `<span class="article-tag">${tag}</span>`
        ).join('') || '';

        return `
            <article class="article-card" data-slug="${article.slug}">
                <div class="article-header">
                    <div class="article-meta">
                        <span class="article-category">
                            <i class="${categoryInfo.icon}"></i>
                            ${article.category}
                        </span>
                        <span class="article-date">${publishedDate}</span>
                    </div>
                    <h2 class="article-title">${article.title}</h2>
                    <p class="article-excerpt">${article.excerpt}</p>
                    <div class="article-tags">
                        ${tagsHTML}
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
    }

    /**
     * Render featured article
     */
    renderFeaturedArticle() {
        const featuredSection = document.getElementById('featuredSection');
        const featuredContainer = document.getElementById('featuredArticle');

        if (!featuredContainer) return;

        const featuredArticle = this.articles.find(article => article.featured);

        if (!featuredArticle) {
            if (featuredSection) featuredSection.style.display = 'none';
            return;
        }

        if (featuredSection) featuredSection.style.display = 'block';

        const publishedDate = new Date(featuredArticle.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        featuredContainer.innerHTML = `
            <article class="featured-article" data-slug="${featuredArticle.slug}">
                <div class="featured-meta">
                    <span class="featured-category">${featuredArticle.category}</span>
                    <span class="featured-date">${publishedDate}</span>
                </div>
                <h2 class="featured-title">${featuredArticle.title}</h2>
                <p class="featured-excerpt">${featuredArticle.excerpt}</p>
                <div class="featured-stats">
                    <span><i class="fas fa-clock"></i> ${featuredArticle.reading_time || 5} min read</span>
                    <span><i class="fas fa-eye"></i> ${this.formatNumber(featuredArticle.view_count || 0)} views</span>
                </div>
            </article>
        `;

        // Add click handler for featured article
        const featuredElement = featuredContainer.querySelector('.featured-article');
        if (featuredElement) {
            featuredElement.addEventListener('click', () => {
                this.navigateToArticle(featuredArticle.slug);
            });
        }
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No articles found</h3>
                <p>Try adjusting your search or filter criteria.</p>
                <button class="btn-primary" onclick="window.ToolShelfBlog.clearFilters()">
                    <i class="fas fa-refresh"></i>
                    Clear Filters
                </button>
            </div>
        `;
    }

    /**
     * Setup article click handlers
     */
    setupArticleClickHandlers() {
        const articleCards = document.querySelectorAll('.article-card');
        articleCards.forEach(card => {
            card.addEventListener('click', () => {
                const slug = card.dataset.slug;
                this.navigateToArticle(slug);
            });
        });
    }

    /**
     * Navigate to article
     */
    navigateToArticle(slug) {
        // Track article click
        this.trackArticleClick(slug);

        // Navigate to article page
        window.location.href = `/blog/${slug}/`;
    }

    /**
     * Track article click analytics
     */
    async trackArticleClick(slug) {
        try {
            // Find article
            const article = this.articles.find(a => a.slug === slug);
            if (!article) return;

            // Track in Supabase (increment view count)
            await this.supabase.rpc('increment_view_count', {
                article_id: article.id
            });

            // Track detailed analytics
            const sessionId = this.getSessionId();
            await this.supabase.from('article_analytics').insert({
                article_id: article.id,
                event_type: 'view',
                user_session: sessionId,
                referrer: document.referrer || window.location.href
            });

        } catch (error) {
            console.error('❌ Failed to track article click:', error);
        }
    }

    /**
     * Update blog stats
     */
    updateStats() {
        const totalArticles = document.getElementById('totalArticles');
        const totalViews = document.getElementById('totalViews');

        if (totalArticles) {
            totalArticles.textContent = this.articles.length;
        }

        if (totalViews) {
            const totalViewCount = this.articles.reduce((sum, article) =>
                sum + (article.view_count || 0), 0
            );
            totalViews.textContent = this.formatNumber(totalViewCount);
        }
    }

    /**
     * Handle newsletter signup
     */
    async handleNewsletterSignup(event) {
        const form = event.target;
        const email = form.querySelector('input[type="email"]').value;
        const button = form.querySelector('button');

        // Disable button and show loading
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';

        try {
            // Here you would integrate with your newsletter service
            // For now, we'll just simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success message
            this.showToast('Successfully subscribed to newsletter!', 'success');
            form.reset();

        } catch (error) {
            console.error('❌ Newsletter signup failed:', error);
            this.showToast('Failed to subscribe. Please try again.', 'error');
        } finally {
            // Reset button
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-paper-plane"></i> Subscribe';
        }
    }

    /**
     * Utility Functions
     */

    getCategoryInfo(category) {
        const categoryMap = {
            'Backend Development': { icon: 'fas fa-server', color: '#3b82f6' },
            'Database Systems': { icon: 'fas fa-database', color: '#059669' },
            'Microservices': { icon: 'fas fa-cubes', color: '#dc2626' },
            'Developer Tools': { icon: 'fas fa-tools', color: '#7c3aed' },
            'Performance': { icon: 'fas fa-tachometer-alt', color: '#ea580c' },
            'Architecture': { icon: 'fas fa-sitemap', color: '#0891b2' }
        };

        return categoryMap[category] || { icon: 'fas fa-file-alt', color: '#6b7280' };
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

    getSessionId() {
        let sessionId = localStorage.getItem('blog_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('blog_session_id', sessionId);
        }
        return sessionId;
    }

    clearFilters() {
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.searchQuery = '';

        // Reset UI
        document.getElementById('searchInput').value = '';
        document.getElementById('sortSelect').value = 'newest';
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });

        this.filterAndSortArticles();
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    showError(message) {
        this.showToast(message, 'error');
        this.hideLoading();
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                              type === 'error' ? 'fa-exclamation-circle' : 
                              'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Initialize blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ToolShelfBlog = new ToolShelfBlog();
});

// Make clearFilters available globally
window.clearFilters = () => {
    if (window.ToolShelfBlog) {
        window.ToolShelfBlog.clearFilters();
    }
};