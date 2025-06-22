/**
 * ToolShelf JSON Validator - Validation Logic Module (FIXED - No Cursor Manipulation)
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.JSONValidator = class JSONValidator {
    constructor(formatter) {
        this.formatter = formatter;
        this.debouncedValidate = window.ToolShelf.Utils.debounce(() => {
            this.validateJSON(true);
        }, 300);
    }

    /**
     * Validate JSON with comprehensive error reporting
     */
    validateJSON(isAuto = false) {
        const input = this.formatter.elements.inputText.value.trim();

        if (!input) {
            this.resetValidationStatus();
            return false;
        }

        try {
            const jsonData = JSON.parse(input);
            this.formatter.jsonData = jsonData;

            // Update validation status
            this.updateValidationStatus('Valid JSON', 'valid');
            this.updateJsonStats(jsonData);
            this.hideValidationError();

            this.formatter.validationResult = {
                isValid: true,
                error: null,
                stats: this.calculateJsonStats(jsonData)
            };

            if (!isAuto) {
                this.formatter.showToast('JSON is valid!', 'success');
                this.formatter.stats.validationsCount++;

                // Track usage
                if (window.ToolShelf.Analytics) {
                    window.ToolShelf.Analytics.trackToolUsage('json_formatter', 'validate');
                }
            }

            return true;

        } catch (error) {
            this.formatter.validationResult = {
                isValid: false,
                error: error,
                stats: { size: 0, depth: 0, keys: 0, arrays: 0, objects: 0 }
            };

            this.showValidationError(error);

            if (!isAuto) {
                this.formatter.handleError(error, 'JSON validation failed');
            }

            return false;
        }
    }

    /**
     * Show validation error with detailed information (NO CURSOR MANIPULATION)
     */
    showValidationError(error) {
        this.updateValidationStatus('Invalid JSON', 'invalid');

        const errorDisplay = this.formatter.elements.errorDisplay;
        if (errorDisplay) {
            const errorInfo = this.parseJsonError(error);

            errorDisplay.innerHTML = `
                <div class="error-display-title">${errorInfo.type}</div>
                <div class="error-display-message">${errorInfo.message}</div>
                ${errorInfo.location ? `<div class="error-display-location">📍 ${errorInfo.location}</div>` : ''}
                ${errorInfo.suggestion ? `<div class="error-display-suggestion">💡 ${errorInfo.suggestion}</div>` : ''}
            `;

            errorDisplay.classList.add('show');

            // REMOVED: this.highlightErrorInInput(errorInfo);
            // Just add visual styling without cursor manipulation
            this.addErrorStyling();
        }
    }

    /**
     * Add error styling without cursor manipulation
     */
    addErrorStyling() {
        const inputElement = this.formatter.elements.inputText;
        if (!inputElement) return;

        // Add error styling to input (visual only, no cursor changes)
        inputElement.classList.add('input-error');

        // Remove error styling after 3 seconds
        setTimeout(() => {
            inputElement.classList.remove('input-error');
        }, 3000);
    }

    /**
     * Hide validation error
     */
    hideValidationError() {
        const errorDisplay = this.formatter.elements.errorDisplay;
        if (errorDisplay) {
            errorDisplay.classList.remove('show');
        }

        // Remove error styling
        const inputElement = this.formatter.elements.inputText;
        if (inputElement) {
            inputElement.classList.remove('input-error');
        }
    }

    /**
     * Parse JSON error for better user feedback (NO CURSOR POSITIONING)
     */
    parseJsonError(error) {
        const message = error.message;
        let type = 'Syntax Error';
        let location = null;
        let suggestion = null;

        // Extract position information for display only (not cursor positioning)
        const positionMatch = message.match(/position (\d+)/i);
        const lineMatch = message.match(/line (\d+)/i);
        const columnMatch = message.match(/column (\d+)/i);

        if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            const inputText = this.formatter.elements.inputText.value;
            const lines = inputText.substring(0, position).split('\n');
            const line = lines.length;
            const column = lines[lines.length - 1].length + 1;
            location = `Line ${line}, Column ${column}`;

            // Provide context around the error
            const errorContext = this.getErrorContext(inputText, position);
            if (errorContext) {
                suggestion = `Check around: "${errorContext}"`;
            }
        } else if (lineMatch && columnMatch) {
            location = `Line ${lineMatch[1]}, Column ${columnMatch[1]}`;
        }

        // Categorize error type and provide suggestions
        if (message.includes('Unexpected token')) {
            type = 'Unexpected Token';
            suggestion = this.getSuggestionForUnexpectedToken(message);
        } else if (message.includes('Unexpected end')) {
            type = 'Incomplete JSON';
            suggestion = 'Check for missing closing brackets or quotes';
        } else if (message.includes('duplicate')) {
            type = 'Duplicate Key';
            suggestion = 'Remove or rename duplicate property keys';
        } else if (message.includes('Expected property name')) {
            type = 'Invalid Property';
            suggestion = 'Property names must be strings in double quotes';
        }

        return {
            type,
            message: this.humanizeErrorMessage(message),
            location,
            suggestion
            // REMOVED: position (no longer needed since we don't manipulate cursor)
        };
    }

    /**
     * Get error context around the error position
     */
    getErrorContext(text, position) {
        const start = Math.max(0, position - 10);
        const end = Math.min(text.length, position + 10);
        return text.substring(start, end).trim();
    }

    /**
     * Get specific suggestions for unexpected token errors
     */
    getSuggestionForUnexpectedToken(message) {
        if (message.includes('"')) {
            return 'Check for unescaped quotes in strings';
        } else if (message.includes(',')) {
            return 'Remove trailing commas';
        } else if (message.includes('{') || message.includes('}')) {
            return 'Check for missing or extra braces';
        } else if (message.includes('[') || message.includes(']')) {
            return 'Check for missing or extra brackets';
        }
        return 'Check syntax around the highlighted area';
    }

    /**
     * Make error messages more user-friendly
     */
    humanizeErrorMessage(message) {
        const humanizedMessages = {
            'Unexpected token': 'Invalid character or syntax',
            'Unexpected end of JSON input': 'JSON appears to be incomplete',
            'Expected property name': 'Missing or invalid property name',
            'Expected value': 'Missing or invalid value',
            'Trailing comma': 'Remove trailing comma',
            'Duplicate __proto__': 'Duplicate property key found'
        };

        for (const [pattern, humanMessage] of Object.entries(humanizedMessages)) {
            if (message.includes(pattern)) {
                return humanMessage;
            }
        }

        return message;
    }

    /**
     * Calculate comprehensive JSON statistics
     */
    calculateJsonStats(data) {
        const stats = {
            size: JSON.stringify(data).length,
            depth: 0,
            keys: 0,
            arrays: 0,
            objects: 0,
            nulls: 0,
            booleans: 0,
            numbers: 0,
            strings: 0
        };

        const traverse = (obj, depth = 0) => {
            stats.depth = Math.max(stats.depth, depth);

            if (obj === null) {
                stats.nulls++;
            } else if (typeof obj === 'boolean') {
                stats.booleans++;
            } else if (typeof obj === 'number') {
                stats.numbers++;
            } else if (typeof obj === 'string') {
                stats.strings++;
            } else if (Array.isArray(obj)) {
                stats.arrays++;
                obj.forEach(item => traverse(item, depth + 1));
            } else if (typeof obj === 'object') {
                stats.objects++;
                Object.keys(obj).forEach(key => {
                    stats.keys++;
                    traverse(obj[key], depth + 1);
                });
            }
        };

        traverse(data);
        return stats;
    }

    /**
     * Update JSON-specific statistics display
     */
    updateJsonStats(data) {
        const stats = this.calculateJsonStats(data);
        const elements = this.formatter.elements;

        if (elements.jsonDepth) {
            elements.jsonDepth.textContent = stats.depth;
        }
        if (elements.jsonKeys) {
            elements.jsonKeys.textContent = stats.keys.toLocaleString();
        }
        if (elements.jsonArrays) {
            elements.jsonArrays.textContent = stats.arrays.toLocaleString();
        }
        if (elements.jsonObjects) {
            elements.jsonObjects.textContent = stats.objects.toLocaleString();
        }

        // Update additional stats if elements exist
        const additionalStats = ['nulls', 'booleans', 'numbers', 'strings'];
        additionalStats.forEach(stat => {
            const element = document.getElementById(`json${stat.charAt(0).toUpperCase() + stat.slice(1)}`);
            if (element) {
                element.textContent = stats[stat].toLocaleString();
            }
        });
    }

    /**
     * Update validation status display
     */
    updateValidationStatus(message, type) {
        const statusElement = this.formatter.elements.validationStatus;
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `validation-status ${type}`;
        }
    }

    /**
     * Reset validation status
     */
    resetValidationStatus() {
        this.updateValidationStatus('Ready to process JSON', 'neutral');
        this.hideValidationError();

        // Reset JSON stats
        const statElements = ['jsonDepth', 'jsonKeys', 'jsonArrays', 'jsonObjects'];
        statElements.forEach(id => {
            const element = this.formatter.elements[id];
            if (element) element.textContent = '0';
        });
    }

    /**
     * Check if JSON is likely minified
     */
    isMinified(jsonString) {
        const lines = jsonString.split('\n');
        const avgLineLength = jsonString.length / lines.length;
        return lines.length < 5 && avgLineLength > 100;
    }

    /**
     * Validate JSON schema (basic implementation)
     */
    validateSchema(data, schema) {
        // Basic schema validation - can be extended
        try {
            if (schema.type && typeof data !== schema.type) {
                return { valid: false, error: `Expected type ${schema.type}, got ${typeof data}` };
            }

            if (schema.required && typeof data === 'object') {
                const missing = schema.required.filter(key => !(key in data));
                if (missing.length > 0) {
                    return { valid: false, error: `Missing required properties: ${missing.join(', ')}` };
                }
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.formatter = null;
        this.debouncedValidate = null;
    }
};