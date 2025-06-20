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

        this.setupExamples();
    }

    /**
     * Setup JSONPath example buttons
     */
    setupExamples() {
        const examples = [
            { path: '$', description: 'Root object' },
            { path: '$.store.book[*].author', description: 'All book authors' },
            { path: '$.store.book[?(@.price < 10)]', description: 'Books under $10' },
            { path: '$..author', description: 'All authors (recursive)' },
            { path: '$.store.book[0,1]', description: 'First two books' },
            { path: '$.store.book[-1]', description: 'Last book' },
            { path: '$.*.length', description: 'Length of all arrays' }
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
            resultElement.value = 'Error: No valid JSON data to query';
            return;
        }

        try {
            const result = this.evaluateJsonPath(path, this.formatter.jsonData);

            // Format result
            const formattedResult = this.formatQueryResult(result);
            resultElement.value = formattedResult;

            // Add to history
            this.addToHistory(path, result);

        } catch (error) {
            resultElement.value = `Error: ${error.message}`;
            console.warn('JSONPath query failed:', error);
        }
    }

    /**
     * Enhanced JSONPath evaluation
     */
    evaluateJsonPath(path, data) {
        // Handle root path
        if (path === '$') {
            return data;
        }

        // Basic path validation
        if (!path.startsWith('$')) {
            throw new Error('JSONPath must start with $');
        }

        try {
            // If JSONPath Plus library is available, use it
            if (window.JSONPath) {
                return window.JSONPath({ path: path, json: data });
            }

            // Fallback to custom implementation
            return this.customJsonPathEvaluator(path, data);

        } catch (error) {
            throw new Error(`Invalid JSONPath expression: ${error.message}`);
        }
    }

    /**
     * Custom JSONPath evaluator (basic implementation)
     */
    customJsonPathEvaluator(path, data) {
        let current = data;
        let results = [current];

        // Remove the $ and split by dots, but preserve bracket notation
        const segments = this.parseJsonPath(path.substring(1));

        for (const segment of segments) {
            const newResults = [];

            for (const item of results) {
                if (item === null || item === undefined) continue;

                const segmentResults = this.processSegment(segment, item);
                newResults.push(...segmentResults);
            }

            results = newResults;
            if (results.length === 0) break;
        }

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

        return segments;
    }

    /**
     * Process a single JSONPath segment
     */
    processSegment(segment, data) {
        // Handle recursive descent (..)
        if (segment === '.') {
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
        const bracketContent = segment.match(/\[([^\]]+)\]/);
        if (!bracketContent) return [];

        const content = bracketContent[1];
        const propertyName = segment.substring(0, segment.indexOf('['));

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
                .filter(i => i >= 0 && i < target.length)
                .map(i => target[i]);
        }

        // Handle basic filter expressions [?(@.price < 10)]
        if (content.startsWith('?(')) {
            return this.processFilter(content, target);
        }

        return [];
    }

    /**
     * Process filter expressions
     */
    processFilter(filterExpression, data) {
        if (!Array.isArray(data)) return [];

        // Remove ?( and trailing )
        const condition = filterExpression.slice(2, -1);

        // Basic filter parsing (simplified)
        const match = condition.match(/@\.([^<>=!]+)\s*([<>=!]+)\s*(.+)/);
        if (!match) return [];

        const [, property, operator, value] = match;
        const targetValue = this.parseFilterValue(value);

        return data.filter(item => {
            if (!item || typeof item !== 'object') return false;

            const itemValue = this.getNestedProperty(item, property);
            return this.evaluateCondition(itemValue, operator, targetValue);
        });
    }

    /**
     * Parse filter value (string, number, boolean)
     */
    parseFilterValue(value) {
        const trimmed = value.trim();

        // String values (quoted)
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.slice(1, -1);
        }

        // Boolean values
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed === 'null') return null;

        // Numeric values
        const num = parseFloat(trimmed);
        if (!isNaN(num)) return num;

        return trimmed;
    }

    /**
     * Evaluate filter condition
     */
    evaluateCondition(leftValue, operator, rightValue) {
        switch (operator) {
            case '<': return leftValue < rightValue;
            case '<=': return leftValue <= rightValue;
            case '>': return leftValue > rightValue;
            case '>=': return leftValue >= rightValue;
            case '==': return leftValue == rightValue;
            case '===': return leftValue === rightValue;
            case '!=': return leftValue != rightValue;
            case '!==': return leftValue !== rightValue;
            default: return false;
        }
    }

    /**
     * Get nested property value
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, prop) => {
            return current && current[prop];
        }, obj);
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
            data.forEach(item => this.recursiveSearch(item, results));
        } else if (data && typeof data === 'object') {
            Object.values(data).forEach(value => {
                results.push(value);
                this.recursiveSearch(value, results);
            });
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
                return '[]';
            }

            if (result.length === 1 && typeof result[0] !== 'object') {
                return String(result[0]);
            }
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
     * Get common JSONPath patterns for the current data structure
     */
    suggestPaths(data) {
        const suggestions = [];

        // Basic paths
        suggestions.push('$');

        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data)) {
                suggestions.push('$[*]');
                suggestions.push('$[0]');
                suggestions.push('$[-1]');
                suggestions.push('$.length');
            } else {
                // Object properties
                Object.keys(data).forEach(key => {
                    suggestions.push(`$.${key}`);

                    if (Array.isArray(data[key])) {
                        suggestions.push(`$.${key}[*]`);
                        suggestions.push(`$.${key}.length`);
                    }
                });
            }
        }

        return suggestions;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.formatter = null;
        this.queryHistory = [];
    }
};