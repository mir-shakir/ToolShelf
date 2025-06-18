// Site-wide navigation functionality
class Navigation {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupActiveStates();
        this.setupSmoothScrolling();
        this.setupToolNavigation(); 
    }

    setupMobileMenu() {
        // Mobile menu toggle functionality
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (mobileToggle && mobileMenu) {
            mobileToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }
    }

    setupActiveStates() {
        // REPLACE your existing setupActiveStates with this improved version:
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');

            // Handle different navigation scenarios
            if (href === currentPath ||
                (currentPath !== '/' && href.includes(currentPath)) ||
                (this.isToolPage() && href.includes('#tools'))) {
                link.classList.add('active');
            }
        });
    }

    setupSmoothScrolling() {
        // REPLACE your existing setupSmoothScrolling with this improved version:
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                // Only handle same-page anchors (not cross-page anchors)
                if (!href.includes('index.html')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    setupToolNavigation() {
        if (this.isToolPage()) {
            const navLinks = document.querySelectorAll('.nav-link');

            navLinks.forEach(link => {
                link.addEventListener('click', function (e) {
                    const href = this.getAttribute('href');

                    // Handle anchor links to homepage
                    if (href.includes('#') && href.includes('index.html')) {
                        // Let browser navigate, homepage will handle scrolling
                        return;
                    }
                });
            });

            // Track navigation usage
            if (window.ToolShelf && window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackEvent('tool_navigation_viewed');
            }
        }
    }

    // Check if current page is a tool page
    isToolPage() {
        const path = window.location.pathname;
        return path.includes('text-transformer') ||
            path.includes('base64-encoder') ||
            path.includes('/tools/');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Navigation();
});