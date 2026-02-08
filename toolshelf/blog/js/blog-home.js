import { blogPosts } from './blog-config.js';
import { initBlogSidebar } from './sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('blogSearchInput');
    const blogGrid = document.querySelector('.blog-grid');
    const noResultsMessage = document.getElementById('noBlogResults');
    const blogSearchClearBtn = document.getElementById('blogSearchClear');
    const featuredPostSection = document.querySelector('.featured-post-section');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    const POSTS_PER_PAGE = 6;
    let visiblePosts = POSTS_PER_PAGE;
    let currentFilteredPosts = blogPosts.filter(post => !post.isFeatured);
    let activeCategoryFilter = null;

    if (!searchInput || !blogGrid || !featuredPostSection || !loadMoreBtn) {
        return; // Exit if essential elements are not found
    }

    // Initialize sidebar (compact category-only mode)
    const sidebar = initBlogSidebar('#blog-sidebar-container', { mode: 'home' });

    // Wire up category filtering from sidebar clicks
    if (sidebar) {
        sidebar.onCategoryClick = (categoryKey) => {
            if (activeCategoryFilter === categoryKey) {
                // Toggle off
                activeCategoryFilter = null;
                sidebar.clearActiveCategory();
            } else {
                activeCategoryFilter = categoryKey;
                sidebar.setActiveCategory(categoryKey);
            }
            filterPosts();
        };
    }

    const renderFeaturedPost = () => {
        const featuredPost = blogPosts.find(post => post.isFeatured);
        if (!featuredPost) {
            featuredPostSection.style.display = 'none';
            return;
        }
        const featuredPostCard = featuredPostSection.querySelector('.featured-post-card');
        const featuredPostThumbnail = featuredPostCard.querySelector('.featured-post-thumbnail');
        const featuredPostTitle = featuredPostCard.querySelector('.featured-post-title');
        const featuredPostExcerpt = featuredPostCard.querySelector('.featured-post-excerpt');
        const featuredPostMetaSpans = featuredPostCard.querySelectorAll('.featured-post-meta span');
        const featuredPostButton = featuredPostCard.querySelector('.featured-post-button');

        featuredPostThumbnail.style.backgroundImage = `url('${featuredPost.thumbnail}')`;
        featuredPostTitle.textContent = featuredPost.title;
        featuredPostExcerpt.textContent = featuredPost.excerpt;
        featuredPostMetaSpans[0].innerHTML = `<i class="fas fa-calendar-alt"></i> ${featuredPost.date}`;
        featuredPostMetaSpans[1].innerHTML = `<i class="fas fa-clock"></i> ${featuredPost.readTime}`;
        featuredPostButton.href = `./${featuredPost.slug}/`;
        featuredPostSection.style.display = 'block';
    };

    const renderBlogPosts = () => {
        blogGrid.innerHTML = '';
        const postsToDisplay = currentFilteredPosts.slice(0, visiblePosts);

        if (postsToDisplay.length === 0) {
            noResultsMessage.style.display = 'block';
        } else {
            noResultsMessage.style.display = 'none';
        }

        postsToDisplay.forEach(post => {
            const postCard = document.createElement('a');
            postCard.href = `./${post.slug}/`;
            postCard.classList.add('post-card');
            postCard.innerHTML = `
                <div class="post-card-thumbnail" style="background-image: url('${post.thumbnail}');"></div>
                <div class="post-card-content">
                    <h2 class="post-card-title">${post.title}</h2>
                    <p class="post-card-excerpt">${post.excerpt}</p>
                    <div class="post-card-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${post.date}</span>
                        <span><i class="fas fa-clock"></i> ${post.readTime}</span>
                    </div>
                    <div class="post-card-tags">
                        ${post.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                    </div>
                </div>
            `;
            blogGrid.appendChild(postCard);
        });

        // Show or hide the "Load More" button
        if (currentFilteredPosts.length > visiblePosts) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    };

    const renderTagCloud = () => {
        // Tag cloud replaced by sidebar categories
    };

    const filterPosts = () => {
        const query = searchInput.value.toLowerCase().trim();

        featuredPostSection.style.display = (query || activeCategoryFilter) ? 'none' : 'block';

        currentFilteredPosts = blogPosts.filter(post => {
            if (post.isFeatured) return false;
            const title = post.title.toLowerCase();
            const excerpt = post.excerpt.toLowerCase();
            const postTags = post.tags.map(tag => tag.toLowerCase());

            const matchesSearch = !query || title.includes(query) || excerpt.includes(query) || postTags.some(t => t.includes(query));
            const matchesCategory = !activeCategoryFilter || post.category === activeCategoryFilter;

            return matchesSearch && matchesCategory;
        });

        visiblePosts = POSTS_PER_PAGE; // Reset visible posts on new filter
        renderBlogPosts();
        blogSearchClearBtn.style.display = query ? 'block' : 'none';
    };

    // Event Listeners
    searchInput.addEventListener('input', filterPosts);

    blogSearchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterPosts();
    });

    loadMoreBtn.addEventListener('click', () => {
        visiblePosts += POSTS_PER_PAGE;
        renderBlogPosts();
    });

    // Initial Render
    renderFeaturedPost();
    renderTagCloud();
    filterPosts(); // Initial post render
});
