// /blog/js/blog-config.js

export const blogPosts = [
    {
        slug: 'the-hidden-cost-of-your-hash-functions',
        title: 'The Hidden Cost of Your Hash Functions: Why SHA-256 Might Be Killing Your API Performance',
        excerpt: 'Explore the hidden performance costs of cryptographic hash functions like SHA-256 and learn when to choose faster alternatives for optimal API performance.',
        thumbnail: '../blog/assets/images/blog-cover-hash-featured.png',
        date: 'July 11, 2025',
        readTime: '8 min read',
        tags: ['Performance', 'Security', 'Hashing', 'API'],
        isFeatured: true
    },
    {
        slug: 'the-uuid-gotcha-that-burned-me',
        title: 'The UUID Gotcha That Burned Me: Why UUID4 Isn\'t Always Random Enough',
        excerpt: 'Discover why UUID4s aren\'t always random enough in high-throughput or entropy-starved environments, and learn about alternative ID generation strategies for robust distributed systems.',
        thumbnail: '../blog/assets/images/blog-cover-uuid.png',
        date: 'July 11, 2025',
        readTime: '8 min read',
        tags: ['UUID', 'Performance', 'Randomness', 'Distributed Systems', 'Node.js']
    },
    {
        slug: 'why-your-llm-api-costs-are-through-the-roof',
        title: 'Why Your LLM API Costs Are Through the Roof (And How to Fix It)',
        excerpt: 'Discover how common mistakes can inflate your LLM API costs and learn practical strategies to cut expenses by optimizing token usage, context management, model selection, caching, and batching.',
        thumbnail: '../blog/assets/images/blog-cover-llm.png',
        date: 'July 11, 2025',
        readTime: '10 min read',
        tags: ['LLM', 'API Costs', 'Optimization', 'AI', 'Performance', 'Engineering']
    },
    {
        slug: 'database-migrations-disasters',
        title: 'Database Migrations: The Silent Killer of Production Deployments', 
        excerpt: 'Learn why database migrations are a common source of production failures and discover strategies for safe, zero-downtime schema changes, handling locks, indexes, and rollbacks.',
        thumbnail: '../blog/assets/images/blog-cover-migrations.png',
        date: '2025-07-12',
        readTime: '9 min read',
        tags: ['Database', 'Migrations', 'Production', 'DevOps', 'PostgreSQL'],
    },
    {
        slug: 'privacy-first-dev-tools',
        title: 'Enhancing Developer Productivity with Privacy-First Tools: Lessons from Building ToolShelf',
        excerpt: 'Discover why privacy-first, offline-ready developer tools matter, the philosophy behind ToolShelf, and actionable tips for safer, faster coding workflows.',
        thumbnail: '../blog/assets/images/blog-cover-privacyfeatured.png',
        date: 'July 19, 2025',
        readTime: '6 min read',
        tags: ['Productivity', 'Privacy', 'DevTools', 'Story']
    }

];