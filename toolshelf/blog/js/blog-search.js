/**
 * ToolShelf Blog - Advanced Search & Filtering
 * Handles search functionality, filters, and content discovery
 */

class BlogSearchEngine {
    constructor() {
        this.searchIndex = [];
        this.searchResults = [];
        this.searchSuggestions = [];
        this.recentSearches = this.loadRecentSearches();

        this.init();
    }

    init() {
        this.setupSearchAutocomplete();
        this.setupKeyboardShortcuts();
        this.indexArticles();

        console.log('✅ Blog Search Engine initialized');
    }

    /**
     * Index articles for search
     */
    indexArticles() {
        if (!window.ToolShelfBlog || !window.ToolShelfBlog.articles) {
            // Wait for articles to load
            setTimeout(() => this.indexArticles(), 1000);
            return;
        }

        this.searchIndex = window.ToolShelfBlog.articles.map(article => ({
            id: article.id,
            slug: article.slug,
            title: article.title.toLowerCase(),
            excerpt: article.excerpt?.toLowerCase() || '',
            content: article.content?.toLowerCase() || '',
            category: article.category?.toLowerCase() || '',
            tags: article.tags?.map(tag => tag.toLowerCase()) || [],
            tech_stack: article.tech_stack?.map(tech => tech.toLowerCase()) || [],
            author: article.author_name?.toLowerCase() || '',
            searchableText: this.createSearchableText(article)
        }));

        console.log(`✅ Indexed ${this.searchIndex.length} articles for search`);
    }

    /**
     * Create searchable text from article
     */
    createSearchableText(article) {
        const parts = [
            article.title,
            article.excerpt,
            article.category,
            ...(article.tags || []),
            ...(article.tech_stack || []),
            article.author_name
        ].filter(Boolean);

        return parts.join(' ').toLowerCase();
    }

    /**
     * Setup search autocomplete
     */
    setupSearchAutocomplete() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        // Create autocomplete dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';
        dropdown.style.display = 'none';
        searchInput.parentElement.appendChild(dropdown);

        let debounceTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.handleSearchInput(e.target.value, dropdown);
            }, 300);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value) {
                this.showSearchDropdown(dropdown);
            } else {
                this.showRecentSearches(dropdown);
            }
        });

        searchInput.addEventListener('blur', (e) => {
            // Delay hiding to allow clicking on dropdown items
            setTimeout(() => {
                this.hideSearchDropdown(dropdown);
            }, 200);
        });

        // Handle keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            this.handleSearchKeyboard(e, dropdown);
        });
    }

    /**
     * Handle search input
     */
    handleSearchInput(query, dropdown) {
        if (!query.trim()) {
            this.showRecentSearches(dropdown);
            return;
        }

        const suggestions = this.generateSearchSuggestions(query);
        this.displaySearchSuggestions(suggestions, dropdown);
        this.showSearchDropdown(dropdown);
    }

    /**
     * Generate search suggestions
     */
    generateSearchSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();

        // Article title matches
        this.searchIndex.forEach(article => {
            if (article.title.includes(queryLower)) {
                suggestions.push({
                    type: 'article',
                    text: article.title,
                    slug: article.slug,
                    category: article.category
                });
            }
        });

        // Category matches
        const categories = [...new Set(this.searchIndex.map(a => a.category))];
        categories.forEach(category => {
            if (category.includes(queryLower)) {
                suggestions.push({
                    type: 'category',
                    text: category,
                    filter: category.replace(/\s+/g, '-')
                });
            }
        });

        // Tag matches
        const allTags = [...new Set(this.searchIndex.flatMap(a => a.tags))];
        allTags.forEach(tag => {
            if (tag.includes(queryLower)) {
                suggestions.push({
                    type: 'tag',
                    text: tag,
                    filter: tag
                });
            }
        });

        // Tech stack matches
        const allTech = [...new Set(this.searchIndex.flatMap(a => a.tech_stack))];
        allTech.forEach(tech => {
            if (tech.includes(queryLower)) {
                suggestions.push({
                    type: 'tech',
                    text: tech,
                    filter: tech
                });
            }
        });

        return suggestions.slice(0, 8); // Limit suggestions
    }

    /**
     * Display search suggestions
     */
    displaySearchSuggestions(suggestions, dropdown) {
        if (suggestions.length === 0) {
            dropdown.innerHTML = `
                <div class="search-suggestion no-results">
                    <i class="fas fa-search"></i>
                    <span>No suggestions found</span>
                </div>
            `;
            return;
        }

        const suggestionsHTML = suggestions.map(suggestion => {
            const icon = this.getSuggestionIcon(suggestion.type);
            return `
                <div class="search-suggestion" data-type="${suggestion.type}" data-value="${suggestion.slug || suggestion.filter || suggestion.text}">
                    <i class="${icon}"></i>
                    <span>${this.highlightQuery(suggestion.text, document.getElementById('searchInput').value)}</span>
                    <small>${suggestion.type}</small>
                </div>
            `;
        }).join('');

        dropdown.innerHTML = suggestionsHTML;

        // Add click handlers
        dropdown.querySelectorAll('.search-suggestion').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSuggestion(item);
            });
        });
    }

    /**
     * Show recent searches
     */
    showRecentSearches(dropdown) {
        if (this.recentSearches.length === 0) {
            dropdown.innerHTML = `
                <div class="search-section">
                    <div class="search-section-title">
                        <i class="fas fa-lightbulb"></i>
                        Try searching for:
                    </div>
                    <div class="search-suggestion" data-type="query" data-value="clickhouse">
                        <i class="fas fa-database"></i>
                        <span>ClickHouse</span>
                    </div>
                    <div class="search-suggestion" data-type="query" data-value="kafka">
                        <i class="fas fa-stream"></i>
                        <span>Kafka</span>
                    </div>
                    <div class="search-suggestion" data-type="query" data-value="microservices">
                        <i class="fas fa-cubes"></i>
                        <span>Microservices</span>
                    </div>
                </div>
            `;
        } else {
            const recentHTML = this.recentSearches.map(search => `
                <div class="search-suggestion recent" data-type="query" data-value="${search}">
                    <i class="fas fa-history"></i>
                    <span>${search}</span>
                    <button class="remove-recent" onclick="BlogSearchEngine.removeRecentSearch('${search}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');

            dropdown.innerHTML = `
                <div class="search-section">
                    <div class="search-section-title">
                        <i class="fas fa-history"></i>
                        Recent Searches
                    </div>
                    ${recentHTML}
                </div>
            `;
        }

        this.showSearchDropdown(dropdown);

        // Add click handlers
        dropdown.querySelectorAll('.search-suggestion').forEach(item => {
            item.addEventListener('click', () => {
                this.selectSuggestion(item);
            });
        });
    }

    /**
     * Select suggestion
     */
    selectSuggestion(item) {
        const type = item.dataset.type;
        const value = item.dataset.value;
        const searchInput = document.getElementById('searchInput');

        switch (type) {
            case 'article':
                // Navigate to article
                window.location.href = `/blog/${value}/`;
                break;

            case 'category':
            case 'tag':
            case 'tech':
                // Apply filter
                this.applyFilter(type, value);
                break;

            case 'query':
                // Perform search
                searchInput.value = value;
                this.performSearch(value);
                break;
        }

        this.addToRecentSearches(searchInput.value);
        this.hideSearchDropdown(item.closest('.search-dropdown'));
    }

    /**
     * Apply filter
     */
    applyFilter(type, value) {
        if (window.ToolShelfBlog) {
            // Update filter in main blog
            window.ToolShelfBlog.currentFilter = value;

            // Update filter UI
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.filter === value);
            });

            // Apply filter
            window.ToolShelfBlog.filterAndSortArticles();
        }
    }

    /**
     * Perform search
     */
    performSearch(query) {
        if (window.ToolShelfBlog) {
            window.ToolShelfBlog.searchQuery = query.toLowerCase();
            window.ToolShelfBlog.filterAndSortArticles();
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });
    }

    /**
     * Handle keyboard navigation in search dropdown
     */
    handleSearchKeyboard(e, dropdown) {
        const suggestions = dropdown.querySelectorAll('.search-suggestion');
        const active = dropdown.querySelector('.search-suggestion.active');
        let newActive;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!active) {
                    newActive = suggestions[0];
                } else {
                    const currentIndex = Array.from(suggestions).indexOf(active);
                    newActive = suggestions[currentIndex + 1] || suggestions[0];
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (!active) {
                    newActive = suggestions[suggestions.length - 1];
                } else {
                    const currentIndex = Array.from(suggestions).indexOf(active);
                    newActive = suggestions[currentIndex - 1] || suggestions[suggestions.length - 1];
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (active) {
                    this.selectSuggestion(active);
                } else {
                    this.performSearch(e.target.value);
                    this.addToRecentSearches(e.target.value);
                }
                break;

            case 'Escape':
                this.hideSearchDropdown(dropdown);
                e.target.blur();
                break;
        }

        // Update active suggestion
        if (newActive) {
            suggestions.forEach(s => s.classList.remove('active'));
            newActive.classList.add('active');
        }
    }

    /**
     * Utility functions
     */
    getSuggestionIcon(type) {
        const icons = {
            article: 'fas fa-file-alt',
            category: 'fas fa-folder',
            tag: 'fas fa-tag',
            tech: 'fas fa-code',
            query: 'fas fa-search'
        };
        return icons[type] || 'fas fa-search';
    }

    highlightQuery(text, query) {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    showSearchDropdown(dropdown) {
        dropdown.style.display = 'block';
    }

    hideSearchDropdown(dropdown) {
        dropdown.style.display = 'none';
    }

    addToRecentSearches(query) {
        if (!query.trim()) return;

        // Remove if already exists
        this.recentSearches = this.recentSearches.filter(s => s !== query);

        // Add to beginning
        this.recentSearches.unshift(query);

        // Keep only last 5
        this.recentSearches = this.recentSearches.slice(0, 5);

        // Save to localStorage
        localStorage.setItem('blog_recent_searches', JSON.stringify(this.recentSearches));
    }

    loadRecentSearches() {
        try {
            const saved = localStorage.getItem('blog_recent_searches');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    removeRecentSearch(query) {
        this.recentSearches = this.recentSearches.filter(s => s !== query);
        localStorage.setItem('blog_recent_searches', JSON.stringify(this.recentSearches));

        // Refresh dropdown if open
        const dropdown = document.querySelector('.search-dropdown');
        if (dropdown && dropdown.style.display === 'block') {
            this.showRecentSearches(dropdown);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.BlogSearchEngine = new BlogSearchEngine();
});

// Make removeRecentSearch available globally
window.removeRecentSearch = (query) => {
    if (window.BlogSearchEngine) {
        window.BlogSearchEngine.removeRecentSearch(query);
    }
};