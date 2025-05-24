/**
 * Text Transformer Tool
 * Handles all text transformation operations with live preview
 */
class TextTransformer {
    constructor() {
        this.inputElement = document.getElementById('inputText');
        this.outputElement = document.getElementById('outputText');
        this.transformCheckboxes = document.querySelectorAll('[data-transform]');
        this.clearButton = document.getElementById('clearInput');
        this.copyButton = document.getElementById('copyOutput');
        
        // Stats elements
        this.charCountElement = document.getElementById('charCount');
        this.wordCountElement = document.getElementById('wordCount');
        this.lineCountElement = document.getElementById('lineCount');
        
        // State
        this.activeTransforms = new Set();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateOutput();
    }

    setupEventListeners() {
        // Input text change with debouncing for better performance
        const debouncedUpdate = window.app.debounce(() => this.updateOutput(), 150);
        this.inputElement.addEventListener('input', debouncedUpdate);
        this.inputElement.addEventListener('paste', debouncedUpdate);

        // Transform checkboxes
        this.transformCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const transform = e.target.getAttribute('data-transform');
                if (e.target.checked) {
                    this.activeTransforms.add(transform);
                } else {
                    this.activeTransforms.delete(transform);
                }
                this.updateOutput();
            });
        });

        // Action buttons
        this.clearButton.addEventListener('click', () => this.clearInput());
        this.copyButton.addEventListener('click', () => this.copyOutput());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        this.clearInput();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.copyOutput();
                        break;
                }
            }
        });
    }

    /**
     * Update the output text with all active transformations
     */
    updateOutput() {
        try {
            let text = this.inputElement.value;
            
            // Update statistics first
            this.updateStats(text);
            
            // Apply transformations in specific order for consistency
            const orderedTransforms = [
                'trimWhitespace',
                'removeDuplicates',
                'sortLines',
                'uppercase',
                'lowercase',
                'titlecase',
                'reverse'
            ];

            for (const transform of orderedTransforms) {
                if (this.activeTransforms.has(transform)) {
                    text = this.applyTransform(text, transform);
                }
            }

            this.outputElement.value = text;
            this.updateCopyButtonState();
            
        } catch (error) {
            window.app.handleError(error, 'Error applying transformations');
        }
    }

    /**
     * Apply a specific transformation to text
     */
    applyTransform(text, transformType) {
        try {
            switch (transformType) {
                case 'uppercase':
                    return text.toUpperCase();
                
                case 'lowercase':
                    return text.toLowerCase();
                
                case 'titlecase':
                    return this.toTitleCase(text);
                
                case 'reverse':
                    return this.reverseText(text);
                
                case 'removeDuplicates':
                    return this.removeDuplicateLines(text);
                
                case 'trimWhitespace':
                    return this.trimWhitespace(text);
                
                case 'sortLines':
                    return this.sortLines(text);
                
                default:
                    return text;
            }
        } catch (error) {
            console.error(`Error applying transform ${transformType}:`, error);
            return text; // Return original text if transformation fails
        }
    }

    /**
     * Convert text to title case
     */
    toTitleCase(text) {
        // Articles, conjunctions, and prepositions to keep lowercase (unless first/last word)
        const minorWords = new Set([
            'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 
            'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet'
        ]);

        return text.split('\n').map(line => {
            return line.split(' ').map((word, index, words) => {
                const cleanWord = word.toLowerCase().trim();
                if (!cleanWord) return word;
                
                // Always capitalize first and last word, or if not a minor word
                if (index === 0 || index === words.length - 1 || !minorWords.has(cleanWord)) {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                return cleanWord;
            }).join(' ');
        }).join('\n');
    }

    /**
     * Reverse the text (character by character)
     */
    reverseText(text) {
        return text.split('').reverse().join('');
    }

    /**
     * Remove duplicate lines while preserving order
     */
    removeDuplicateLines(text) {
        const lines = text.split('\n');
        const seen = new Set();
        const uniqueLines = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!seen.has(trimmedLine)) {
                seen.add(trimmedLine);
                uniqueLines.push(line);
            }
        }

        return uniqueLines.join('\n');
    }

    /**
     * Trim whitespace from each line and remove empty lines at start/end
     */
    trimWhitespace(text) {
        const lines = text.split('\n');
        let trimmedLines = lines.map(line => line.trim());
        
        // Remove empty lines from start
        while (trimmedLines.length > 0 && trimmedLines[0] === '') {
            trimmedLines.shift();
        }
        
        // Remove empty lines from end
        while (trimmedLines.length > 0 && trimmedLines[trimmedLines.length - 1] === '') {
            trimmedLines.pop();
        }
        
        return trimmedLines.join('\n');
    }

    /**
     * Sort lines alphabetically
     */
    sortLines(text) {
        const lines = text.split('\n');
        return lines.sort((a, b) => {
            // Case-insensitive sort
            return a.toLowerCase().localeCompare(b.toLowerCase());
        }).join('\n');
    }

    /**
     * Update text statistics
     */
    updateStats(text) {
        // Character count (including spaces and newlines)
        const charCount = text.length;
        
        // Word count (split by whitespace, filter empty strings)
        const wordCount = text.trim() === '' ? 0 : 
            text.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        // Line count
        const lineCount = text === '' ? 0 : text.split('\n').length;

        // Update display
        this.charCountElement.textContent = charCount.toLocaleString();
        this.wordCountElement.textContent = wordCount.toLocaleString();
        this.lineCountElement.textContent = lineCount.toLocaleString();
    }

    /**
     * Clear input text and reset transformations
     */
    clearInput() {
        this.inputElement.value = '';
        this.updateOutput();
        this.inputElement.focus();
        window.app.showToast('Input cleared', 'success', 2000);
    }

    /**
     * Copy output text to clipboard
     */
    async copyOutput() {
        const outputText = this.outputElement.value;
        
        if (!outputText.trim()) {
            window.app.showToast('No text to copy', 'error', 2000);
            return;
        }

        try {
            const success = await window.app.copyToClipboard(outputText);
            if (success) {
                window.app.showToast('Text copied to clipboard!', 'success');
                this.copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    this.copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy Output';
                }, 2000);
            } else {
                throw new Error('Copy failed');
            }
        } catch (error) {
            window.app.showToast('Failed to copy text. Please select and copy manually.', 'error');
        }
    }

    /**
     * Update copy button state based on output content
     */
    updateCopyButtonState() {
        const hasOutput = this.outputElement.value.trim().length > 0;
        this.copyButton.disabled = !hasOutput;
        
        if (!hasOutput) {
            this.copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy Output';
        }
    }

    /**
     * Get current transformation summary
     */
    getTransformationSummary() {
        if (this.activeTransforms.size === 0) {
            return 'No transformations applied';
        }
        
        const transforms = Array.from(this.activeTransforms).map(transform => {
            switch (transform) {
                case 'uppercase': return 'UPPERCASE';
                case 'lowercase': return 'lowercase';
                case 'titlecase': return 'Title Case';
                case 'reverse': return 'Reverse';
                case 'removeDuplicates': return 'Remove Duplicates';
                case 'trimWhitespace': return 'Trim Whitespace';
                case 'sortLines': return 'Sort Lines';
                default: return transform;
            }
        });
        
        return `Applied: ${transforms.join(', ')}`;
    }

    /**
     * Reset all transformations
     */
    resetTransformations() {
        this.transformCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        this.activeTransforms.clear();
        this.updateOutput();
    }

    /**
     * Handle tool becoming visible (called by main app)
     */
    onShow() {
        this.inputElement.focus();
    }

    /**
     * Export current state for potential future features
     */
    exportState() {
        return {
            input: this.inputElement.value,
            output: this.outputElement.value,
            activeTransforms: Array.from(this.activeTransforms),
            stats: {
                chars: this.charCountElement.textContent,
                words: this.wordCountElement.textContent,
                lines: this.lineCountElement.textContent
            }
        };
    }

    /**
     * Import state for potential future features
     */
    importState(state) {
        try {
            this.inputElement.value = state.input || '';
            this.activeTransforms = new Set(state.activeTransforms || []);
            
            // Update checkboxes
            this.transformCheckboxes.forEach(checkbox => {
                const transform = checkbox.getAttribute('data-transform');
                checkbox.checked = this.activeTransforms.has(transform);
            });
            
            this.updateOutput();
        } catch (error) {
            window.app.handleError(error, 'Failed to import state');
        }
    }
}