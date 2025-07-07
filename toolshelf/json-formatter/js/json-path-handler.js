/**
 * ToolShelf JSON Path Handler - JSONPath Query Functionality Module
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.JSONPathHandler = class JSONPathHandler {
    constructor(formatter) {
        this.formatter = formatter;
        this.currentPath = '';
        this.queryHistory = [];
        this.maxHistoryLength = 10;

        // Initialize library check
        // this.initializeLibrary();
        this.setupExamples();
    }

    /**
     * Initialize and check JSONPath library
     */
    // initializeLibrary() {
    //     // Check for JSONPath Plus library (correct way)
    //     this.jsonPathLib = null;

    //     // JSONPath Plus exposes JSONPath as the main function
    //     if (typeof window.JSONPath !== 'undefined') {
    //         this.jsonPathLib = window.JSONPath;
    //         console.log('✅ JSONPath Plus library loaded successfully');
    //     }
    //     // Check for the UMD module export
    //     else if (typeof window.jsonpath !== 'undefined') {
    //         this.jsonPathLib = window.jsonpath;
    //         console.log('✅ JSONPath library found via jsonpath global');
    //     }
    //     // Check if it's available under a different name
    //     else if (typeof JSONPath !== 'undefined') {
    //         this.jsonPathLib = JSONPath;
    //         console.log('✅ JSONPath library found in global scope');
    //     }
    //     else {
    //         console.warn('⚠️ JSONPath library not found, using fallback implementation');
    //         // Try to check what's actually available
    //         console.log('Available globals:', Object.keys(window).filter(key => key.toLowerCase().includes('json')));
    //     }
    // }

    /**
     * Setup JSONPath example buttons
     */
    setupExamples() {
        const examples = [
            { path: '$', description: 'Root object' },
            { path: '$.customer_id', description: 'Customer ID' },
            { path: '$.segments[*]', description: 'All segments' },
            { path: '$.cart_offers[*]', description: 'All cart offers' },
            { path: '$.segments[0]', description: 'First segment' },
            { path: '$.segments[-1]', description: 'Last segment' },
            { path: '$..price', description: 'All prices (recursive)' }
        ];

        const container = document.querySelector('.jsonpath-examples');
        if (container) {
            container.innerHTML = examples.map(example =>
                `<button class="jsonpath-example-btn" 
                         onclick="window.ToolShelf.currentTool.pathHandler.setJsonPath('${example.path}')"
                         title="${example.description}">
                    ${example.path}
                 </button>`
            ).join('');
        }
    }

    /**
     * Set JSONPath query and execute
     */
    setJsonPath(path) {
        const pathInput = this.formatter.elements.jsonPathInput;
        if (pathInput) {
            pathInput.value = path;
            this.currentPath = path;
            this.executeJsonPath();
        }
    }

    /**
     * Execute JSONPath query
     */
    executeJsonPath() {

        if (!this.jsonPathLib && typeof window.JSONPath !== 'undefined') {
            this.jsonPathLib = window.JSONPath;
            console.log('✅ JSONPath Plus is now available in handler');
        }
        const pathInput = this.formatter.elements.jsonPathInput;
        const resultElement = this.formatter.elements.jsonPathResult;

        if (!pathInput || !resultElement) return;

        const path = pathInput.value.trim();
        this.currentPath = path;

        if (!path) {
            resultElement.value = '';
            return;
        }

        if (!this.formatter.jsonData) {
            resultElement.value = 'Error: No valid JSON data to query\nPlease paste valid JSON in the input area first.';
            return;
        }

        try {
            const result = this.evaluateJsonPath(path, this.formatter.jsonData);

            // Format result
            const formattedResult = this.formatQueryResult(result);
            resultElement.value = formattedResult;

            // Add to history
            this.addToHistory(path, result);

            console.log('✅ JSONPath query executed successfully:', path, result);

        } catch (error) {
            const errorMessage = `Error: ${error.message}\n\nTip: Try these patterns:\n• $ (root)\n• $.property (access property)\n• $.array[*] (all array items)\n• $.array[0] (first item)\n• $..property (recursive search)`;
            resultElement.value = errorMessage;
            console.warn('❌ JSONPath query failed:', error);
        }
    }

    /**
     * Enhanced JSONPath evaluation with multiple fallbacks
     */
    evaluateJsonPath(path, data) {
        // Handle root path
        if (path === '$') {
            return data;
        }

        // Basic path validation
        if (!path.startsWith('$')) {
            throw new Error('JSONPath must start with $ (root)');
        }

        try {
            // Try JSONPath Plus library first (CORRECTED)
            if (this.jsonPathLib) {
                // JSONPath Plus expects an options object with path and json properties
                if (typeof this.jsonPathLib === 'function') {
                    return this.jsonPathLib({ path: path, json: data });
                }
                // Alternative API style
                else if (this.jsonPathLib.JSONPath) {
                    return this.jsonPathLib.JSONPath({ path: path, json: data });
                }
                // Query method style
                else if (this.jsonPathLib.query) {
                    return this.jsonPathLib.query(data, path);
                }
            }

            // Fallback to custom implementation
            console.log('📝 Using custom JSONPath implementation for:', path);
            return this.customJsonPathEvaluator(path, data);

        } catch (error) {
            console.warn('Library evaluation failed, trying custom implementation:', error);
            // If library fails, try custom implementation
            try {
                return this.customJsonPathEvaluator(path, data);
            } catch (customError) {
                throw new Error(`Invalid JSONPath expression: ${customError.message}`);
            }
        }
    }

    /**
     * Enhanced custom JSONPath evaluator
     */
    customJsonPathEvaluator(path, data) {
        let current = data;

        // Handle root-only path
        if (path === '$') {
            return current;
        }

        // Remove the $ and split by dots, but preserve bracket notation
        const segments = this.parseJsonPath(path.substring(1));

        if (segments.length === 0) {
            return current;
        }

        let results = [current];

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const newResults = [];

            for (const item of results) {
                if (item === null || item === undefined) continue;

                try {
                    const segmentResults = this.processSegment(segment, item);
                    newResults.push(...segmentResults);
                } catch (segmentError) {
                    console.warn(`Segment processing failed for "${segment}":`, segmentError);
                    continue;
                }
            }

            results = newResults;
            if (results.length === 0) break;
        }

        // Return single item if only one result, otherwise return array
        return results.length === 1 ? results[0] : results;
    }

    /**
     * Parse JSONPath into segments
     */
    parseJsonPath(path) {
        if (!path) return [];

        const segments = [];
        let current = '';
        let inBrackets = false;
        let bracketDepth = 0;

        for (let i = 0; i < path.length; i++) {
            const char = path[i];

            if (char === '[') {
                if (current && !inBrackets) {
                    segments.push(current);
                    current = '';
                }
                current += char;
                inBrackets = true;
                bracketDepth++;
            } else if (char === ']') {
                current += char;
                bracketDepth--;
                if (bracketDepth === 0) {
                    segments.push(current);
                    current = '';
                    inBrackets = false;
                }
            } else if (char === '.' && !inBrackets) {
                if (current) {
                    segments.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current) {
            segments.push(current);
        }

        return segments.filter(s => s.length > 0);
    }

    /**
     * Process a single JSONPath segment
     */
    processSegment(segment, data) {
        // Handle recursive descent (..)
        if (segment === '..') {
            return this.recursiveSearch(data);
        }

        // Handle bracket notation
        if (segment.includes('[') && segment.includes(']')) {
            return this.processBracketNotation(segment, data);
        }

        // Handle wildcard
        if (segment === '*') {
            return this.getWildcardResults(data);
        }

        // Handle simple property access
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            return data.hasOwnProperty(segment) ? [data[segment]] : [];
        }

        return [];
    }

    /**
     * Process bracket notation [index], [*], [filter]
     */
    processBracketNotation(segment, data) {
        const bracketMatch = segment.match(/^([^[]*)\[([^\]]+)\]$/);
        if (!bracketMatch) return [];

        const [, propertyName, content] = bracketMatch;

        // Get the target object/array
        let target = data;
        if (propertyName && target && typeof target === 'object') {
            target = target[propertyName];
        }

        if (!target) return [];

        // Handle wildcard [*]
        if (content === '*') {
            return this.getWildcardResults(target);
        }

        // Handle array indices [0], [1], [-1], etc.
        if (content.match(/^-?\d+$/)) {
            if (!Array.isArray(target)) return [];

            const index = parseInt(content);
            const actualIndex = index < 0 ? target.length + index : index;

            return actualIndex >= 0 && actualIndex < target.length ? [target[actualIndex]] : [];
        }

        // Handle multiple indices [0,1,2]
        if (content.includes(',')) {
            if (!Array.isArray(target)) return [];

            const indices = content.split(',').map(i => parseInt(i.trim()));
            return indices
                .filter(i => !isNaN(i) && i >= 0 && i < target.length)
                .map(i => target[i]);
        }

        return [];
    }

    /**
     * Get wildcard results (all values)
     */
    getWildcardResults(data) {
        if (Array.isArray(data)) {
            return [...data];
        } else if (data && typeof data === 'object') {
            return Object.values(data);
        }
        return [];
    }

    /**
     * Recursive search for descendant nodes
     */
    recursiveSearch(data, results = []) {
        if (Array.isArray(data)) {
            results.push(...data);
            data.forEach(item => this.recursiveSearch(item, results));
        } else if (data && typeof data === 'object') {
            const values = Object.values(data);
            results.push(...values);
            values.forEach(value => this.recursiveSearch(value, results));
        }
        return results;
    }

    /**
     * Format query result for display
     */
    formatQueryResult(result) {
        if (result === undefined) {
            return 'undefined';
        }

        if (result === null) {
            return 'null';
        }

        if (Array.isArray(result)) {
            if (result.length === 0) {
                return '[] (empty array)';
            }

            if (result.length === 1 && typeof result[0] !== 'object') {
                return `${String(result[0])}\n\n(Found 1 item)`;
            }

            // For arrays, show JSON formatted with item count
            return `${JSON.stringify(result, null, 2)}\n\n(Found ${result.length} items)`;
        }

        if (typeof result === 'object') {
            return JSON.stringify(result, null, 2);
        }

        return String(result);
    }

    /**
     * Add query to history
     */
    addToHistory(path, result) {
        this.queryHistory.unshift({
            path,
            result,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.queryHistory.length > this.maxHistoryLength) {
            this.queryHistory = this.queryHistory.slice(0, this.maxHistoryLength);
        }
    }

    /**
     * Get query history
     */
    getHistory() {
        return this.queryHistory;
    }

    /**
     * Clear query result
     */
    clearResult() {
        const resultElement = this.formatter.elements.jsonPathResult;
        if (resultElement) {
            resultElement.value = '';
        }
        this.currentPath = '';
    }

    /**
     * Cleanup
     */
    destroy() {
        this.formatter = null;
        this.queryHistory = [];
        this.jsonPathLib = null;
    }
};