/**
 * ToolShelf Blog - Static Homepage Enhancements
 * Adds interactivity to the static blog homepage
 */

class BlogStaticPage {
    constructor() {
        this.supabase = null;
        this.init();
    }

    async init() {
        try {
            // Initialize Supabase for analytics
            this.initSupabase();

            // Setup interactions
            this.setupArticleClicks();
            this.setupNewsletterForm();
            this.setupAnalytics();

            console.log('✅ Blog static page initialized');
        } catch (error) {
            console.error('❌ Blog static page init failed:', error);
        }
    }

    initSupabase() {
        const supabaseUrl = 'https://hcqhtcngwqeqvlwybvyq.supabase.co'; // Replace with your URL
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcWh0Y25nd3FlcXZsd3lidnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NTI0NTIsImV4cCI6MjA1MDUyODQ1Mn0.PJBHKuLBj17y2jOwXCTJUCX3lNaGUr_f4qZGUXWWIgE'; // Replace with your key

        if (typeof window.supabase !== 'undefined') {
            this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        }
    }

    setupArticleClicks() {
        // Add click tracking to article cards
        const articleCards = document.querySelectorAll('.article-card, .featured-article');

        articleCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();

                // Get article slug from onclick attribute or data
                const onclick = card.getAttribute('onclick');
                if (onclick) {
                    const slugMatch = onclick.match(/\/blog\/([^\/]+)\//);
                    if (slugMatch) {
                        const slug = slugMatch[1];
                        this.trackArticleClick(slug);

                        // Navigate after tracking
                        setTimeout(() => {
                            window.location.href = `/blog/${slug}/`;
                        }, 100);
                    }
                }
            });

            // Add hover effects
            card.style.cursor = 'pointer';
        });
    }

    async trackArticleClick(slug) {
        if (!this.supabase) return;

        try {
            // Track blog homepage article click
            const sessionId = this.getSessionId();

            await this.supabase.from('article_analytics').insert({
                article_slug: slug,
                event_type: 'homepage_click',
                user_session: sessionId,
                referrer: document.referrer || 'direct',
                created_at: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Failed to track article click:', error);
        }
    }

    setupNewsletterForm() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = form.querySelector('input[type="email"]').value;
            const button = form.querySelector('button');

            // Disable button and show loading
            button.disabled = true;
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';

            try {
                // Here you would integrate with your newsletter service
                // For now, we'll track the signup attempt
                if (this.supabase) {
                    await this.supabase.from('newsletter_signups').insert({
                        email: email,
                        source: 'blog_homepage',
                        created_at: new Date().toISOString()
                    });
                }

                // Show success
                this.showToast('Successfully subscribed to newsletter!', 'success');
                form.reset();

            } catch (error) {
                console.error('❌ Newsletter signup failed:', error);
                this.showToast('Failed to subscribe. Please try again.', 'error');
            } finally {
                // Reset button
                button.disabled = false;
                button.innerHTML = originalHTML;
            }
        });
    }

    setupAnalytics() {
        // Track page view
        if (this.supabase) {
            this.trackPageView();
        }

        // Track scroll depth
        this.setupScrollTracking();
    }

    async trackPageView() {
        try {
            const sessionId = this.getSessionId();

            await this.supabase.from('page_analytics').insert({
                page_type: 'blog_homepage',
                user_session: sessionId,
                referrer: document.referrer || 'direct',
                user_agent: navigator.userAgent,
                created_at: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Failed to track page view:', error);
        }
    }

    setupScrollTracking() {
        let maxScroll = 0;
        let scrollTracked = false;

        const trackScroll = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );

            maxScroll = Math.max(maxScroll, scrollPercent);

            // Track when user scrolls past 50% and 90%
            if (maxScroll >= 50 && !scrollTracked) {
                scrollTracked = true;
                this.trackScrollDepth(50);
            } else if (maxScroll >= 90 && scrollTracked) {
                this.trackScrollDepth(90);
            }
        };

        window.addEventListener('scroll', trackScroll);
    }

    async trackScrollDepth(depth) {
        if (!this.supabase) return;

        try {
            const sessionId = this.getSessionId();

            await this.supabase.from('page_analytics').insert({
                page_type: 'blog_homepage_scroll',
                event_data: { scroll_depth: depth },
                user_session: sessionId,
                created_at: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Failed to track scroll depth:', error);
        }
    }

    getSessionId() {
        let sessionId = localStorage.getItem('toolshelf_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('toolshelf_session_id', sessionId);
        }
        return sessionId;
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlogStaticPage();
});