/**
 * ToolShelf JSON Syntax Highlighter - Lightweight Syntax Highlighting Module
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.JSONSyntaxHighlighter = class JSONSyntaxHighlighter {
    constructor(formatter) {
        this.formatter = formatter;
        this.syntaxOverlay = null;
        this.isEnabled = true;

        this.debouncedHighlight = window.ToolShelf.Utils.debounce(() => {
            this.applySyntaxHighlighting();
        }, 200);

        this.setupSyntaxOverlay();
    }

    /**
     * Setup syntax highlighting overlay
     */
    setupSyntaxOverlay() {
        const outputTextArea = this.formatter.elements.outputText;
        if (!outputTextArea) return;

        const outputPanel = outputTextArea.parentElement;

        // Create syntax overlay
        this.syntaxOverlay = document.createElement('div');
        this.syntaxOverlay.className = 'syntax-overlay';
        this.syntaxOverlay.id = 'syntaxOverlay';

        // Add container class for positioning
        outputPanel.classList.add('syntax-highlighted');
        outputPanel.appendChild(this.syntaxOverlay);

        // Sync scrolling between textarea and overlay
        this.syncScrolling(outputTextArea, this.syntaxOverlay);

        console.log('🎨 Syntax highlighting overlay setup complete');
    }

    /**
     * Sync scrolling between textarea and overlay
     */
    syncScrolling(textarea, overlay) {
        textarea.addEventListener('scroll', () => {
            overlay.scrollTop = textarea.scrollTop;
            overlay.scrollLeft = textarea.scrollLeft;
        });
    }

    /**
     * Apply syntax highlighting to the output
     */
    applySyntaxHighlighting() {
        if (!this.isEnabled || !this.syntaxOverlay) return;

        const outputTextArea = this.formatter.elements.outputText;
        const jsonText = outputTextArea.value;

        if (!jsonText.trim()) {
            this.clearHighlighting();
            return;
        }

        try {
            // Only highlight if it's valid JSON and formatted (not minified)
            if (this.formatter.validationResult.isValid && !this.isMinified(jsonText)) {
                const highlighted = this.highlightJson(jsonText);
                this.syntaxOverlay.innerHTML = highlighted;
                this.syntaxOverlay.style.display = 'block';

                // Hide the actual text and show overlay
                outputTextArea.classList.add('has-content');

                console.log('🎨 Syntax highlighting applied');
            } else {
                this.clearHighlighting();
            }
        } catch (error) {
            console.warn('Syntax highlighting failed:', error);
            this.clearHighlighting();
        }
    }


    /**
 * Force clear highlighting (for emergency cleanup)
 */
    forceClear() {
        const outputTextArea = this.formatter.elements.outputText;

        if (this.syntaxOverlay) {
            this.syntaxOverlay.innerHTML = '';
            this.syntaxOverlay.style.display = 'none';
        }

        if (outputTextArea) {
            outputTextArea.classList.remove('has-content');
            outputTextArea.style.color = '';

            // Force a repaint
            outputTextArea.offsetHeight;
        }

        console.log('🎨 Syntax highlighting force cleared');
    }
    
    /**
     * Check if JSON is minified (single line, no indentation)
     */
    isMinified(jsonText) {
        const lines = jsonText.split('\n').filter(line => line.trim());
        return lines.length === 1 || jsonText.length > 1000 && lines.length < 10;
    }

    /**
     * Custom JSON syntax highlighter
     */
    highlightJson(jsonString) {
        // Escape HTML characters first
        let highlighted = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Apply syntax highlighting with improved regex patterns
        highlighted = highlighted
            // Property keys (before colons)
            .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="json-key">$1</span>:')

            // String values (after colons or in arrays)
            .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>')
            .replace(/\[\s*("(?:[^"\\]|\\.)*")/g, '[<span class="json-string">$1</span>')
            .replace(/,\s*("(?:[^"\\]|\\.)*")/g, ', <span class="json-string">$1</span>')

            // Boolean values
            .replace(/:\s*(true|false)\b/g, ': <span class="json-boolean">$1</span>')
            .replace(/\[\s*(true|false)\b/g, '[<span class="json-boolean">$1</span>')
            .replace(/,\s*(true|false)\b/g, ', <span class="json-boolean">$1</span>')

            // Null values
            .replace(/:\s*(null)\b/g, ': <span class="json-null">$1</span>')
            .replace(/\[\s*(null)\b/g, '[<span class="json-null">$1</span>')
            .replace(/,\s*(null)\b/g, ', <span class="json-null">$1</span>')

            // Number values (including negative, decimal, scientific notation)
            .replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, ': <span class="json-number">$1</span>')
            .replace(/\[\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, '[<span class="json-number">$1</span>')
            .replace(/,\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g, ', <span class="json-number">$1</span>')

            // Punctuation (braces, brackets, commas)
            .replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>');

        return highlighted;
    }

    /**
     * Clear syntax highlighting and handle empty states
     */
    clearHighlighting() {
        if (this.syntaxOverlay) {
            this.syntaxOverlay.innerHTML = '';
            this.syntaxOverlay.style.display = 'none';
        }

        // Ensure output textarea shows placeholder properly
        const outputTextArea = this.formatter.elements.outputText;
        if (outputTextArea) {
            outputTextArea.classList.remove('has-content');
            // Force reset the color to ensure placeholder is visible
            outputTextArea.style.color = '';
        }

        console.log('🎨 Syntax highlighting cleared');
    }

    /**
     * Enable/disable syntax highlighting
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;

        if (!enabled) {
            this.clearHighlighting();
        } else if (this.formatter.elements.outputText.value) {
            this.debouncedHighlight();
        }
    }

    /**
     * Toggle syntax highlighting
     */
    toggle() {
        this.setEnabled(!this.isEnabled);
        return this.isEnabled;
    }

    /**
     * Get current highlighting state
     */
    isHighlightingEnabled() {
        return this.isEnabled;
    }

    /**
     * Highlight specific line or range (for error highlighting)
     */
    highlightError(line, column = null) {
        if (!this.syntaxOverlay) return;

        // Add error highlighting class
        const lines = this.syntaxOverlay.innerHTML.split('\n');
        if (line > 0 && line <= lines.length) {
            lines[line - 1] = `<span class="json-error-line">${lines[line - 1]}</span>`;
            this.syntaxOverlay.innerHTML = lines.join('\n');
        }
    }

    /**
     * Remove error highlighting
     */
    clearErrorHighlighting() {
        if (!this.syntaxOverlay) return;

        const content = this.syntaxOverlay.innerHTML;
        this.syntaxOverlay.innerHTML = content
            .replace(/<span class="json-error-line">/g, '')
            .replace(/<\/span>/g, '');
    }

    /**
     * Update highlighting when output changes
     */
    onOutputChange() {
        if (this.isEnabled) {
            this.debouncedHighlight();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.clearHighlighting();

        if (this.syntaxOverlay && this.syntaxOverlay.parentElement) {
            this.syntaxOverlay.parentElement.removeChild(this.syntaxOverlay);
        }

        this.formatter = null;
        this.syntaxOverlay = null;
        this.debouncedHighlight = null;
    }
};