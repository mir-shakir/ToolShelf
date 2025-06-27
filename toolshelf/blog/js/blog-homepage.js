/**
 * ToolShelf Blog - Homepage Specific Interactions
 */

class BlogHomepage {
    constructor() {
        this.init();
    }

    init() {
        this.setupFilterButtons();
        this.setupSmoothScrolling();
        this.setupAnimations();
        console.log('✅ Blog homepage enhanced');
    }

    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const articleCards = document.querySelectorAll('.article-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filter = button.dataset.filter;

                // Filter articles
                articleCards.forEach(card => {
                    if (filter === 'all') {
                        card.style.display = 'block';
                    } else {
                        const category = card.querySelector('.article-category').textContent.toLowerCase();
                        if (category.includes(filter)) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
    }

    setupSmoothScrolling() {
        const heroBtn = document.querySelector('.btn-primary[href="#latest-articles"]');
        if (heroBtn) {
            heroBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('latest-articles').scrollIntoView({
                    behavior: 'smooth'
                });
            });
        }
    }

    setupAnimations() {
        // Add intersection observer for fade-in animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        });

        // Observe sections
        document.querySelectorAll('.featured-card, .article-card, .category-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlogHomepage();
});