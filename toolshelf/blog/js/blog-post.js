// /blog/js/blog-post.js
import { blogPosts } from './blog-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const articleContent = document.getElementById('articleContent');
    const tocList = document.getElementById('tocList');
    const tocContainer = document.getElementById('tocContainer');
    const progressBar = document.querySelector('.scroll-progress-bar');
    const prevPostLink = document.getElementById('prevPostLink');
    const nextPostLink = document.getElementById('nextPostLink');
    const relatedPostsGrid = document.querySelector('.related-posts-grid');

    // Ensure we are on a blog post page with the necessary elements
    if (!articleContent || !tocList || !progressBar || !tocContainer || !prevPostLink || !nextPostLink || !relatedPostsGrid) {
        return;
    }

    // Get current post slug
    const currentPath = window.location.pathname;
    const currentSlugMatch = currentPath.match(/\/blog\/([^\/]+)\/$/);
    const currentSlug = currentSlugMatch ? currentSlugMatch[1] : null;

    // 1. Generate Table of Contents
    const headings = articleContent.querySelectorAll('h2, h3'); // Include H3 for TOC
    if (headings.length === 0) {
        tocContainer.style.display = 'none';
    }

    headings.forEach(heading => {
        const id = heading.id;
        if (!id) {
            return;
        }
        const title = heading.textContent;
        const listItem = document.createElement('li');
        const link = document.createElement('a');

        link.href = `#${id}`;
        link.textContent = title;
        link.dataset.targetId = id;
        link.classList.add(heading.tagName.toLowerCase()); // Add h2 or h3 class for styling

        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });

    const tocLinks = tocList.querySelectorAll('a');

    // 2. Handle Scroll Progress Bar
    const updateProgressBar = () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;
        const progress = (scrollPosition / totalHeight) * 100;
        progressBar.style.transform = `scaleX(${progress / 100})`;
    };

    // 3. Handle Active TOC Link Highlighting on Scroll
    const updateActiveTocLink = () => {
        let activeId = '';
        
        // Find the heading currently in view or just passed
        for (let i = headings.length - 1; i >= 0; i--) {
            const heading = headings[i];
            const rect = heading.getBoundingClientRect();
            if (rect.top <= 120) { // 120px offset from the top
                activeId = heading.id;
                break;
            }
        }

        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.targetId === activeId) {
                link.classList.add('active');
            }
        });
    };

    // 4. Handle Previous/Next Navigation
    const updateNavigation = () => {
        if (!currentSlug) return;

        const currentIndex = blogPosts.findIndex(post => post.slug === currentSlug);
        const prevPost = blogPosts[currentIndex - 1];
        const nextPost = blogPosts[currentIndex + 1];

        if (prevPost) {
            prevPostLink.href = `../${prevPost.slug}/`;
            prevPostLink.querySelector('.nav-post-title').textContent = prevPost.title;
            prevPostLink.classList.remove('hidden');
        } else {
            prevPostLink.classList.add('hidden');
        }

        if (nextPost) {
            nextPostLink.href = `../${nextPost.slug}/`;
            nextPostLink.querySelector('.nav-post-title').textContent = nextPost.title;
            nextPostLink.classList.remove('hidden');
        } else {
            nextPostLink.classList.add('hidden');
        }
    };

    // Removes the first 'blog' or '/blog' after any leading ../ or ./
    function removeFirstBlogSegment(path) {
        // Match leading ../ or ./
        const match = path.match(/^((?:\.\.\/|\.\/)+)/);
        const prefix = match ? match[1] : '';
        const rest = path.slice(prefix.length);

        // Remove leading 'blog/' or '/blog/' from the rest
        const updatedRest = rest.replace(/^\/?blog\//, '');
        return prefix + updatedRest;
    }

    // 5. Render Related Posts
    const renderRelatedPosts = () => {
        if (!currentSlug) return;

        const filteredPosts = blogPosts.filter(post => post.slug !== currentSlug);
        // Shuffle and pick up to 3 random posts
        const shuffled = filteredPosts.sort(() => 0.5 - Math.random());
        const selectedPosts = shuffled.slice(0, 3);

        relatedPostsGrid.innerHTML = ''; // Clear existing content

        selectedPosts.forEach(post => {
            var thumbnail = removeFirstBlogSegment(post.thumbnail);

            const postCard = `
                <a href="../${post.slug}/" class="post-card">
                    <img src="${thumbnail}" alt="${post.title}" class="post-card-thumbnail">
                    <div class="post-card-content">
                        <h3 class="post-card-title">${post.title}</h3>
                        <p class="post-card-excerpt">${post.excerpt}</p>
                        <div class="post-card-meta">
                            <span><i class="fas fa-calendar-alt"></i> ${post.date}</span>
                            <span><i class="fas fa-clock"></i> ${post.readTime}</span>
                        </div>
                    </div>
                </a>
            `;
            relatedPostsGrid.insertAdjacentHTML('beforeend', postCard);
        });
    };

    // Attach event listeners
    window.addEventListener('scroll', () => {
        updateProgressBar();
        updateActiveTocLink();
    });

    // Initial updates on page load
    updateProgressBar();
    updateActiveTocLink();
    updateNavigation();
    renderRelatedPosts();
});
