/**
 * ToolShelf JSON Operations - Format, Minify, Sort Operations Module
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.JSONOperations = class JSONOperations {
    constructor(formatter) {
        this.formatter = formatter;
    }

    /**
     * Format JSON with current settings
     */
    formatJSON(isAuto = false) {
        const input = this.formatter.elements.inputText.value.trim();

        if (!input) {
            this.formatter.validator.updateValidationStatus('Please enter JSON to format', 'neutral');
            return false;
        }

        try {
            // Parse JSON
            let jsonData = JSON.parse(input);

            // Sort keys if enabled
            if (this.formatter.sortKeys) {
                jsonData = this.sortObjectKeys(jsonData);
            }

            // Format with current indentation
            const formatted = JSON.stringify(jsonData, null, this.formatter.currentIndentation);

            // Update output
            this.formatter.elements.outputText.value = formatted;
            this.formatter.jsonData = jsonData;
            this.formatter.currentOperation = 'format';

            // Update stats and UI
            this.formatter.updateOutputStats(formatted);
            this.formatter.validator.updateValidationStatus('Valid JSON formatted', 'valid');
            this.formatter.validator.updateJsonStats(jsonData);

            // Apply syntax highlighting
            if (this.formatter.enableSyntaxHighlighting) {
                this.formatter.highlighter.onOutputChange();
            }

            if (!isAuto) {
                this.formatter.showToast('JSON formatted successfully!', 'success');
                this.formatter.stats.formattingCount++;

                // Track usage
                if (window.ToolShelf.Analytics) {
                    window.ToolShelf.Analytics.trackToolUsage('json_formatter', 'format');
                }
            }

            return true;

        } catch (error) {
            this.formatter.validator.showValidationError(error);
            if (!isAuto) {
                this.formatter.handleError(error, 'JSON formatting failed');
            }
            return false;
        }
    }

    /**
 * Minify JSON
 */
    minifyJSON(isAuto = false) {
        const input = this.formatter.elements.inputText.value.trim();

        if (!input) {
            this.formatter.validator.updateValidationStatus('Please enter JSON to minify', 'neutral');
            return false;
        }

        try {
            // Parse JSON first to validate
            let jsonData = JSON.parse(input);

            // Sort keys if enabled
            if (this.formatter.sortKeys) {
                jsonData = this.sortObjectKeys(jsonData);
            }

            // Minify (no spacing, no indentation)
            const minified = JSON.stringify(jsonData);

            // Update output
            this.formatter.elements.outputText.value = minified;
            this.formatter.jsonData = jsonData;
            this.formatter.currentOperation = 'minify';

            // Update stats and UI
            this.formatter.updateOutputStats(minified);
            this.formatter.validator.updateValidationStatus('JSON minified successfully', 'valid');
            this.formatter.validator.updateJsonStats(jsonData);

            // Clear syntax highlighting for minified JSON (it's not readable anyway)
            this.formatter.highlighter.clearHighlighting();

            if (!isAuto) {
                const originalSize = input.length;
                const minifiedSize = minified.length;
                const savings = originalSize - minifiedSize;
                const percentage = Math.round((savings / originalSize) * 100);

                this.formatter.showToast(
                    `JSON minified! Reduced from ${originalSize.toLocaleString()} to ${minifiedSize.toLocaleString()} characters. Saved ${savings.toLocaleString()} characters (${percentage}%)`,
                    'success',
                    5000
                );
                this.formatter.stats.formattingCount++;

                // Track usage
                if (window.ToolShelf.Analytics) {
                    window.ToolShelf.Analytics.trackToolUsage('json_formatter', 'minify');
                }
            }

            return true;

        } catch (error) {
            this.formatter.validator.showValidationError(error);
            if (!isAuto) {
                this.formatter.handleError(error, 'JSON minification failed');
            }
            return false;
        }
    }

    /**
     * Sort object keys recursively
     */
    sortObjectKeys(obj) {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        }

        if (typeof obj === 'object') {
            const sorted = {};
            const keys = Object.keys(obj).sort();

            keys.forEach(key => {
                sorted[key] = this.sortObjectKeys(obj[key]);
            });

            return sorted;
        }

        return obj;
    }

    /**
     * Update sort keys button appearance
     */
    updateSortKeysButton() {
        const sortBtn = this.formatter.elements.sortKeysBtn;
        if (!sortBtn) return;

        if (this.formatter.sortKeys) {
            sortBtn.classList.add('primary');
            sortBtn.innerHTML = '<i class="fas fa-check"></i> Keys Sorted';
        } else {
            sortBtn.classList.remove('primary');
            sortBtn.innerHTML = '<i class="fas fa-sort-alpha-down"></i> Sort Keys';
        }
    }

    /**
     * Escape special characters in JSON strings
     */
    escapeJSON(input) {
        try {
            // First validate it's JSON
            const parsed = JSON.parse(input);

            // Convert to string with escaped characters
            return JSON.stringify(JSON.stringify(parsed));

        } catch (error) {
            throw new Error('Invalid JSON for escaping');
        }
    }

    /**
     * Unescape JSON strings
     */
    unescapeJSON(input) {
        try {
            // Remove outer quotes and parse
            const unescaped = JSON.parse(input);

            // If result is string, parse again
            if (typeof unescaped === 'string') {
                return JSON.parse(unescaped);
            }

            return unescaped;

        } catch (error) {
            throw new Error('Invalid escaped JSON');
        }
    }

    /**
     * Remove comments from JSON5-style input
     */
    removeComments(input) {
        return input
            // Remove single-line comments
            .replace(/\/\/.*$/gm, '')
            // Remove multi-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')
            // Clean up extra whitespace
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    /**
     * Compact JSON (remove unnecessary whitespace but keep readable)
     */
    compactJSON(input) {
        try {
            const parsed = JSON.parse(input);
            return JSON.stringify(parsed, null, 1);
        } catch (error) {
            throw new Error('Invalid JSON for compacting');
        }
    }

    /**
     * Extract all string values from JSON
     */
    extractStrings(jsonData) {
        const strings = [];

        const traverse = (obj) => {
            if (typeof obj === 'string') {
                strings.push(obj);
            } else if (Array.isArray(obj)) {
                obj.forEach(traverse);
            } else if (obj !== null && typeof obj === 'object') {
                Object.values(obj).forEach(traverse);
            }
        };

        traverse(jsonData);
        return strings;
    }

    /**
     * Extract all property keys from JSON
     */
    extractKeys(jsonData) {
        const keys = new Set();

        const traverse = (obj) => {
            if (Array.isArray(obj)) {
                obj.forEach(traverse);
            } else if (obj !== null && typeof obj === 'object') {
                Object.keys(obj).forEach(key => {
                    keys.add(key);
                    traverse(obj[key]);
                });
            }
        };

        traverse(jsonData);
        return Array.from(keys).sort();
    }

    /**
     * Flatten nested JSON structure
     */
    flattenJSON(obj, prefix = '', separator = '.') {
        const flattened = {};

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}${separator}${key}` : key;

                if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    Object.assign(flattened, this.flattenJSON(obj[key], newKey, separator));
                } else {
                    flattened[newKey] = obj[key];
                }
            }
        }

        return flattened;
    }

    /**
     * Validate JSON structure against common patterns
     */
    analyzeStructure(jsonData) {
        const analysis = {
            type: this.getDataType(jsonData),
            depth: this.getMaxDepth(jsonData),
            hasArrays: this.hasArrays(jsonData),
            hasNulls: this.hasNulls(jsonData),
            isFlat: this.isFlat(jsonData),
            patterns: this.detectPatterns(jsonData)
        };

        return analysis;
    }

    /**
     * Get the primary data type of JSON
     */
    getDataType(data) {
        if (Array.isArray(data)) {
            return 'array';
        } else if (data === null) {
            return 'null';
        } else if (typeof data === 'object') {
            return 'object';
        } else {
            return typeof data;
        }
    }

    /**
     * Calculate maximum depth of nested structure
     */
    getMaxDepth(obj, depth = 0) {
        if (obj === null || typeof obj !== 'object') {
            return depth;
        }

        if (Array.isArray(obj)) {
            return Math.max(depth, ...obj.map(item => this.getMaxDepth(item, depth + 1)));
        }

        const depths = Object.values(obj).map(value => this.getMaxDepth(value, depth + 1));
        return depths.length > 0 ? Math.max(depth, ...depths) : depth;
    }

    /**
     * Check if structure contains arrays
     */
    hasArrays(obj) {
        if (Array.isArray(obj)) return true;

        if (obj !== null && typeof obj === 'object') {
            return Object.values(obj).some(value => this.hasArrays(value));
        }

        return false;
    }

    /**
     * Check if structure contains null values
     */
    hasNulls(obj) {
        if (obj === null) return true;

        if (Array.isArray(obj)) {
            return obj.some(item => this.hasNulls(item));
        }

        if (typeof obj === 'object') {
            return Object.values(obj).some(value => this.hasNulls(value));
        }

        return false;
    }

    /**
     * Check if structure is flat (no nested objects/arrays)
     */
    isFlat(obj) {
        if (Array.isArray(obj)) {
            return obj.every(item => typeof item !== 'object' || item === null);
        }

        if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).every(value =>
                typeof value !== 'object' || value === null
            );
        }

        return true;
    }

    /**
     * Detect common JSON patterns
     */
    detectPatterns(data) {
        const patterns = [];

        if (Array.isArray(data) && data.length > 0) {
            const firstItem = data[0];
            if (typeof firstItem === 'object' && firstItem !== null) {
                const sameKeys = data.every(item =>
                    typeof item === 'object' &&
                    item !== null &&
                    JSON.stringify(Object.keys(item).sort()) === JSON.stringify(Object.keys(firstItem).sort())
                );

                if (sameKeys) {
                    patterns.push('homogeneous-array');
                }
            }
        }

        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const keys = Object.keys(data);

            // Check for configuration pattern
            if (keys.some(key => ['config', 'settings', 'options'].includes(key.toLowerCase()))) {
                patterns.push('configuration');
            }

            // Check for API response pattern
            if (keys.some(key => ['data', 'result', 'response'].includes(key.toLowerCase()))) {
                patterns.push('api-response');
            }

            // Check for metadata pattern
            if (keys.some(key => ['id', 'type', 'name'].includes(key.toLowerCase()))) {
                patterns.push('entity');
            }
        }

        return patterns;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.formatter = null;
    }
};