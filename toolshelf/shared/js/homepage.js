/**
 * ToolShelf Homepage - Simple Category Filtering Only
 */
(function () {
    'use strict';

    // DOM elements
    let categoryButtons, toolCards, toolsGrid, noResults;

    // State
    let currentCategory = 'all';

    /**
     * Initialize homepage functionality
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupHomepage);
        } else {
            setupHomepage();
        }
    }

    /**
     * Setup homepage features
     */
    function setupHomepage() {
        // Get DOM elements
        toolsGrid = document.getElementById('toolsGrid');
        noResults = document.getElementById('noResults');
        categoryButtons = document.querySelectorAll('.category-btn');
        toolCards = document.querySelectorAll('.tool-card');

        // Setup category filters
        setupCategoryFilters();

        // Setup tool click tracking
        setupToolTracking();

        // Setup coming soon tracking
        setupComingSoonTracking();

        // Initial animation
        animateToolsLoad();

        console.log('🏠 Homepage initialized with', toolCards.length, 'tools');
    }

    /**
     * Setup category filters
     */
    function setupCategoryFilters() {
        if (!categoryButtons.length) {
            console.warn('No category buttons found');
            return;
        }

        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();

                const category = button.dataset.category;
                console.log('Category clicked:', category);

                if (category === currentCategory) return;

                // Update active state
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update current category
                currentCategory = category;

                // Filter tools
                filterToolsByCategory();

                // Track category selection
                if (window.ToolShelf?.Analytics) {
                    window.ToolShelf.Analytics.trackEvent('homepage', 'category_filter', category);
                }
            });
        });
    }

    /**
     * Filter tools by category only
     */
    function filterToolsByCategory() {
        if (!toolCards.length) {
            console.warn('No tool cards found');
            return;
        }

        let visibleCount = 0;

        toolCards.forEach(card => {
            const cardCategory = card.dataset.category;
            let isVisible = true;

            // Category filter
            if (currentCategory !== 'all') {
                isVisible = cardCategory === currentCategory;
            }

            // Apply visibility with smooth animation
            if (isVisible) {
                card.classList.remove('hidden');
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.classList.add('hidden');
                // Use setTimeout to ensure CSS transition works
                setTimeout(() => {
                    if (card.classList.contains('hidden')) {
                        card.style.display = 'none';
                    }
                }, 300);
            }
        });

        console.log(`Filtered to ${visibleCount} tools for category: ${currentCategory}`);

        // Show/hide no results (shouldn't happen with our current tools, but good to have)
        updateNoResultsState(visibleCount);
    }

    /**
     * Update no results state
     */
    function updateNoResultsState(visibleCount) {
        if (!noResults) return;

        if (visibleCount === 0) {
            noResults.style.display = 'block';
            if (toolsGrid) {
                toolsGrid.style.display = 'none';
            }
        } else {
            noResults.style.display = 'none';
            if (toolsGrid) {
                toolsGrid.style.display = 'grid';
            }
        }
    }

    /**
     * Track tool clicks
     */
    function setupToolTracking() {
        const toolButtons = document.querySelectorAll('.tool-button:not(.coming-soon-btn)');

        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const toolCard = button.closest('.tool-card');
                const toolName = toolCard?.querySelector('.tool-title')?.textContent;
                const toolUrl = button.href;

                if (toolName && window.ToolShelf?.Analytics) {
                    window.ToolShelf.Analytics.trackEvent('homepage', 'tool_click', toolName);
                }

                console.log('Tool clicked:', toolName);
            });
        });
    }

    /**
     * Handle coming soon clicks
     */
    function setupComingSoonTracking() {
        const comingSoonButtons = document.querySelectorAll('.coming-soon-btn');

        comingSoonButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const toolCard = button.closest('.tool-card');
                const toolName = toolCard?.querySelector('.tool-title')?.textContent;

                if (toolName) {
                    console.log('Coming soon tool clicked:', toolName);

                    if (window.ToolShelf?.Analytics) {
                        window.ToolShelf.Analytics.trackEvent('homepage', 'coming_soon_click', toolName);
                    }

                    // Show message
                    showComingSoonMessage(toolName);
                }
            });
        });
    }

    /**
     * Show coming soon message
     */
    function showComingSoonMessage(toolName) {
        const message = `🚀 ${toolName} is coming soon!\n\nWe're working hard to bring you this tool. Check back next week for the release!`;

        // Use toast if available, otherwise alert
        if (window.ToolShelf?.Toast) {
            window.ToolShelf.Toast.show(`🚀 ${toolName} is coming soon! Check back next week.`, 'info', 4000);
        } else {
            alert(message);
        }
    }

    /**
     * Animate tools loading
     */
    function animateToolsLoad() {
        if (!toolsGrid) return;

        toolsGrid.classList.add('loading');
        setTimeout(() => {
            toolsGrid.classList.remove('loading');
        }, 100);
    }

    /**
     * Debug function to check setup
     */
    function debugSetup() {
        console.log('=== Homepage Debug Info ===');
        console.log('Category buttons:', categoryButtons.length);
        console.log('Tool cards:', toolCards.length);
        console.log('Current category:', currentCategory);

        // Check data attributes
        toolCards.forEach((card, index) => {
            const title = card.querySelector('.tool-title')?.textContent;
            const category = card.dataset.category;
            console.log(`Tool ${index + 1}: ${title} - Category: ${category}`);
        });
    }

    // Expose debug function globally for testing
    window.debugHomepage = debugSetup;

    // Initialize
    init();

})();