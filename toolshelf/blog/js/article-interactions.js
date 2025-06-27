/**
 * ToolShelf Blog - Article Interactions
 * Handles reading progress, sharing, and feedback for static articles
 */

class ArticleInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.setupReadingProgress();
        this.setupSmoothScrolling();
        this.setupCopyToClipboard();
        console.log('✅ Article interactions initialized');
    }

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

    setupSmoothScrolling() {
        const tocLinks = document.querySelectorAll('.toc-item');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupCopyToClipboard() {
        // Add copy buttons to code blocks
        const codeBlocks = document.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            const button = document.createElement('button');
            button.className = 'copy-code-btn';
            button.innerHTML = '<i class="fas fa-copy"></i>';
            button.title = 'Copy code';

            button.addEventListener('click', () => {
                navigator.clipboard.writeText(block.textContent).then(() => {
                    button.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        button.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                });
            });

            block.parentElement.style.position = 'relative';
            block.parentElement.appendChild(button);
        });
    }
}

// Global functions for sharing and feedback
window.shareArticle = (platform) => {
    const url = window.location.href;
    const title = document.querySelector('.article-title').textContent;
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

window.copyArticleLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        const button = event.target.closest('.share-btn');
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    });
};

window.submitFeedback = (type) => {
    // Here you would send to analytics
    console.log(`Feedback: ${type}`);

    const button = event.target.closest('.feedback-btn');
    button.classList.add('submitted');

    // Show thank you message
    setTimeout(() => {
        alert('Thank you for your feedback!');
    }, 100);
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ArticleInteractions();
});