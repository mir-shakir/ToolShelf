/**
 * Shared SEO Content Management
 * Used across all tool pages for consistent SEO functionality
 */
class SEOContentManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupToggleListeners();
        this.setupInitialStates();
    }

    setupToggleListeners() {
        // SEO content toggle
        window.toggleSeoContent = () => this.toggleSeoContent();

        // Footer content toggle  
        window.toggleFooterContent = () => this.toggleFooterContent();
    }

    toggleSeoContent() {
        const seoContent = document.getElementById('seo-content');
        const expandableContent = seoContent?.querySelector('.seo-expandable');
        const toggleButton = seoContent?.querySelector('.seo-toggle');
        const toggleText = toggleButton?.querySelector('span');

        if (!seoContent || !toggleButton || !toggleText) return;

        if (seoContent.classList.contains('expanded')) {
            // Collapsing
            seoContent.classList.add('collapsing');
            seoContent.classList.remove('expanded');

            toggleText.textContent = 'Learn More';
            toggleButton.setAttribute('aria-label', 'Show more information');
            toggleButton.setAttribute('aria-expanded', 'false');

            // Remove collapsing class after animation completes
            setTimeout(() => {
                seoContent.classList.remove('collapsing');
            }, 400);

        } else {
            // Expanding
            seoContent.classList.remove('collapsing');
            seoContent.classList.add('expanded');

            toggleText.textContent = 'Show Less';
            toggleButton.setAttribute('aria-label', 'Hide additional information');
            toggleButton.setAttribute('aria-expanded', 'true');
        }
    }

    toggleFooterContent() {
        const footerContent = document.getElementById('seo-footer');
        const toggleButton = document.querySelector('.footer-toggle-btn');
        const toggleText = toggleButton?.querySelector('span');

        if (!footerContent || !toggleButton || !toggleText) return;

        footerContent.classList.toggle('visible');

        // Update button text and aria-label
        if (footerContent.classList.contains('visible')) {
            toggleText.textContent = 'Hide Info & FAQ';
            toggleButton.setAttribute('aria-label', 'Hide additional information');
            toggleButton.setAttribute('aria-expanded', 'true');
        } else {
            toggleText.textContent = 'More Info & FAQ';
            toggleButton.setAttribute('aria-label', 'Show more information about ToolShelf');
            toggleButton.setAttribute('aria-expanded', 'false');
        }
    }

    setupInitialStates() {
        // Set initial aria attributes
        const seoToggle = document.querySelector('.seo-toggle');
        const footerToggle = document.querySelector('.footer-toggle-btn');

        if (seoToggle) {
            seoToggle.setAttribute('aria-expanded', 'false');
        }

        if (footerToggle) {
            footerToggle.setAttribute('aria-expanded', 'false');
        }

        // Ensure seo-content starts in collapsed state
        const seoContent = document.getElementById('seo-content');
        if (seoContent) {
            seoContent.classList.remove('expanded', 'collapsing');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SEOContentManager();
});