import { blogPosts } from './blog-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('blogSearchInput');
    const blogGrid = document.querySelector('.blog-grid');
    const noResultsMessage = document.getElementById('noBlogResults');
    const blogSearchClearBtn = document.getElementById('blogSearchClear');
    const tagCloud = document.getElementById('tagCloud');
    const clearTagFilterBtn = document.getElementById('clearTagFilter');
    const featuredPostSection = document.querySelector('.featured-post-section');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    const POSTS_PER_PAGE = 6;
    let visiblePosts = POSTS_PER_PAGE;
    let currentFilteredPosts = blogPosts.filter(post => !post.isFeatured);

    if (!searchInput || !blogGrid || !tagCloud || !clearTagFilterBtn || !featuredPostSection || !loadMoreBtn) {
        return; // Exit if essential elements are not found
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
        const allTags = [...new Set(blogPosts.flatMap(post => post.tags))];
        tagCloud.innerHTML = allTags.map(tag =>
            `<button class="tag-button" data-tag="${tag.toLowerCase()}">${tag}</button>`
        ).join('');
    };

    const filterPosts = () => {
        const query = searchInput.value.toLowerCase().trim();
        const activeTag = document.querySelector('.tag-button.active')?.dataset.tag;

        featuredPostSection.style.display = (query || activeTag) ? 'none' : 'block';

        currentFilteredPosts = blogPosts.filter(post => {
            if (post.isFeatured) return false;
            const title = post.title.toLowerCase();
            const excerpt = post.excerpt.toLowerCase();
            const postTags = post.tags.map(tag => tag.toLowerCase());

            const matchesSearch = !query || title.includes(query) || excerpt.includes(query) || postTags.some(t => t.includes(query));
            const matchesTag = !activeTag || postTags.includes(activeTag);

            return matchesSearch && matchesTag;
        });

        visiblePosts = POSTS_PER_PAGE; // Reset visible posts on new filter
        renderBlogPosts();
        blogSearchClearBtn.style.display = query ? 'block' : 'none';
        clearTagFilterBtn.style.display = activeTag ? 'block' : 'none';
    };

    // Event Listeners
    searchInput.addEventListener('input', filterPosts);

    blogSearchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterPosts();
    });

    tagCloud.addEventListener('click', (event) => {
        const button = event.target.closest('.tag-button');
        if (button) {
            const currentActive = tagCloud.querySelector('.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }
            if (currentActive !== button) {
                button.classList.add('active');
            }
            filterPosts();
        }
    });

    clearTagFilterBtn.addEventListener('click', () => {
        const currentActive = tagCloud.querySelector('.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }
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
