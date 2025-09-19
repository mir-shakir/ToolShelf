// /blog/js/blog-config.js

export const blogPosts = [
    {
        slug: 'jwt-explained-ultimate-guide-api-authentication',
        title: 'JWT Explained: The Ultimate Guide to Secure API Authentication',
        excerpt: 'A complete guide to JSON Web Tokens (JWTs). Learn their structure, how they work, and the security best practices for API authentication.',
        thumbnail: 'https://dszufhozbgwxgoanxljq.supabase.co/storage/v1/object/public/generations/2a6977e2-cb1b-4027-ab46-b33c5c0a7ddc/d1dd3865-ec64-418e-9b24-032198ab3101.png?', // Using the direct URL as per your strategy
        date: 'September 19, 2025',
        readTime: '10 min read',
        tags: ["jwt","authentication","api","security","json"],
        isFeatured: false
    },
    {
        slug: 'the-hidden-cost-of-your-hash-functions',
        title: 'The Hidden Cost of Your Hash Functions: Why SHA-256 Might Be Killing Your API Performance',
        excerpt: 'Explore the hidden performance costs of cryptographic hash functions like SHA-256 and learn when to choose faster alternatives for optimal API performance.',
        thumbnail: '../blog/assets/images/blog-cover-hash-featured.png',
        date: 'July 11, 2025',
        readTime: '8 min read',
        tags: ['Performance', 'Security', 'Hashing', 'API'],
        isFeatured: false
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
    },
    {
        slug: 'why-ai-cant-design',
        title: 'Why Your AI Image Generator Can\'t Design: The Missing Blueprint',
        excerpt: 'AI art generators create beautiful chaos, but they fail at structured design. Discover why a \'blueprint-first\' approach is the key to creating usable, professional visuals for your business.',
        thumbnail: '../blog/assets/images/blog-cover-layoutcraft.png',
        date: 'August 1, 2025',
        readTime: '5 min read',
        tags: ['AI', 'Design', 'Generative Art', 'Productivity'],
        isFeatured: true 
    },
    {
        slug: 'hash-function-security-2025-developers-guide',
        title: 'Hash Function Security in 2025: What Developers Need to Know',
        excerpt: 'Complete guide to hash function security in 2025. Learn about quantum threats, algorithm recommendations, implementation best practices, and future-proofing strategies.',
        thumbnail: '../blog/assets/images/blog-cover-hash-security.png',
        date: 'September 12, 2025',
        readTime: '12 min read',
        tags: ['Security', 'Hashing', 'Cryptography', 'Quantum Computing', 'Best Practices'],
        isFeatured: false
    },
    {
        slug: 'md5-vs-sha256-vs-sha512-which-hash-should-you-use',
        title: 'MD5 vs SHA256 vs SHA512: Which Hash Should You Use?',
        excerpt: 'Complete comparison of MD5, SHA256, and SHA512 hash algorithms. Learn security levels, performance differences, and when to use each algorithm in 2025.',
        thumbnail: '../blog/assets/images/blog-cover-hash-comparison.png',
        date: 'October 5, 2025',
        readTime: '10 min read',
        tags: ['Hashing', 'MD5', 'SHA256', 'SHA512', 'Security', 'Performance'],
        isFeatured: false
    }

];