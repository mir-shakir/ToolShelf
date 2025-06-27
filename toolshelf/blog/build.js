#!/usr/bin/env node

/**
 * ToolShelf Blog Build Script
 * Simple wrapper to run the static generator
 */

require('dotenv').config();
const BlogStaticGenerator = require('./build-static.js');

console.log('🚀 Building ToolShelf Blog...');
console.log(`📅 Build Date: ${new Date().toISOString()}`);
console.log(`👤 Build User: mir-shakir`);

// Run the generator
new BlogStaticGenerator();