/**
 * ToolShelf JSON Syntax Highlighter — Overlay-based Approach
 *
 * Creates a <pre> overlay on top of the output textarea.
 * When enabled the textarea's text is made transparent so
 * only the colour-coded overlay is visible. Scroll sync
 * keeps the two layers aligned.
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.JSONSyntaxHighlighter = class JSONSyntaxHighlighter {
    constructor(formatter) {
        this.formatter = formatter;
        this.syntaxOverlay = null;
        this.isEnabled = true; // ON by default per plan.md

        // Persist preference
        try {
            const saved = localStorage.getItem('toolshelf-json-syntax-hl');
            if (saved !== null) this.isEnabled = saved === 'true';
        } catch (_) { /* ignore */ }

        this.debouncedHighlight = window.ToolShelf.Utils.debounce(() => {
            this.applySyntaxHighlighting();
        }, 120);

        this.setupSyntaxOverlay();
    }

    /* -------------------------------------------------- */
    /*  Setup                                              */
    /* -------------------------------------------------- */

    /** Build the <pre> overlay and wire scroll sync */
    setupSyntaxOverlay() {
        const outputTextArea = this.formatter.elements.outputText;
        if (!outputTextArea) return;

        const pane = outputTextArea.parentElement;

        // Create overlay
        this.syntaxOverlay = document.createElement('pre');
        this.syntaxOverlay.className = 'syntax-overlay';
        this.syntaxOverlay.id = 'syntaxOverlay';
        this.syntaxOverlay.setAttribute('aria-hidden', 'true');

        // Append to the pane (CSS handles position: relative on .ide-pane)
        pane.appendChild(this.syntaxOverlay);

        // Scroll sync: textarea → overlay
        outputTextArea.addEventListener('scroll', () => {
            if (!this.syntaxOverlay) return;
            this.syntaxOverlay.scrollTop = outputTextArea.scrollTop;
            this.syntaxOverlay.scrollLeft = outputTextArea.scrollLeft;
        });

        // Initial state
        if (this.isEnabled) {
            outputTextArea.classList.add('hl-active');
        }

        console.log('🎨 Syntax highlighting overlay ready');
    }

    /* -------------------------------------------------- */
    /*  Core highlighting                                  */
    /* -------------------------------------------------- */

    /** Re-render the overlay from the current output value */
    applySyntaxHighlighting() {
        const outputTextArea = this.formatter.elements.outputText;
        if (!outputTextArea || !this.syntaxOverlay) return;

        const jsonText = outputTextArea.value;

        if (!this.isEnabled || !jsonText.trim()) {
            this.clearHighlighting();
            return;
        }

        try {
            // Only highlight formatted (multi-line) output
            if (this.isMinified(jsonText)) {
                this.clearHighlighting();
                return;
            }

            const highlighted = this.highlightJson(jsonText);
            this.syntaxOverlay.innerHTML = highlighted;
            this.syntaxOverlay.style.display = 'block';
            outputTextArea.classList.add('hl-active');

            // Sync scroll position immediately
            this.syntaxOverlay.scrollTop = outputTextArea.scrollTop;
            this.syntaxOverlay.scrollLeft = outputTextArea.scrollLeft;
        } catch (error) {
            console.warn('Syntax highlighting failed:', error);
            this.clearHighlighting();
        }
    }

    /** Tokenise JSON string into coloured spans */
    highlightJson(jsonString) {
        // Escape HTML
        let h = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Property keys
        h = h.replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="json-key">$1</span>:');

        // String values (after colon, in arrays, after commas)
        h = h.replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>');
        h = h.replace(/\[\s*("(?:[^"\\]|\\.)*")/g, '[<span class="json-string">$1</span>');
        h = h.replace(/,\s*("(?:[^"\\]|\\.)*")/g, ', <span class="json-string">$1</span>');

        // Booleans
        h = h.replace(/(:\s*|[\[,]\s*)(true|false)\b/g, '$1<span class="json-boolean">$2</span>');

        // Null
        h = h.replace(/(:\s*|[\[,]\s*)(null)\b/g, '$1<span class="json-null">$2</span>');

        // Numbers
        h = h.replace(/(:\s*|[\[,]\s*)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
            '$1<span class="json-number">$2</span>');

        // Braces, brackets, commas
        h = h.replace(/([{}[\]])/g, '<span class="json-bracket">$1</span>');

        return h;
    }

    /** Heuristic: is the text a single minified line? */
    isMinified(jsonText) {
        const lines = jsonText.split('\n').filter(l => l.trim());
        return lines.length <= 1;
    }

    /* -------------------------------------------------- */
    /*  Public API                                         */
    /* -------------------------------------------------- */

    /** Called by operations whenever the output textarea value changes */
    onOutputChange() {
        if (this.isEnabled) {
            this.debouncedHighlight();
        } else {
            this.clearHighlighting();
        }
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        try { localStorage.setItem('toolshelf-json-syntax-hl', String(enabled)); } catch (_) { /* */ }

        const outputTextArea = this.formatter.elements.outputText;
        if (!enabled) {
            this.clearHighlighting();
            if (outputTextArea) outputTextArea.classList.remove('hl-active');
        } else {
            if (outputTextArea) outputTextArea.classList.add('hl-active');
            if (outputTextArea && outputTextArea.value.trim()) {
                this.applySyntaxHighlighting();
            }
        }
    }

    toggle() {
        this.setEnabled(!this.isEnabled);
        return this.isEnabled;
    }

    isHighlightingEnabled() {
        return this.isEnabled;
    }

    /** Remove overlay content and restore textarea visibility */
    clearHighlighting() {
        if (this.syntaxOverlay) {
            this.syntaxOverlay.innerHTML = '';
            this.syntaxOverlay.style.display = 'none';
        }
        // Always remove the transparent-text class so the real text is visible
        const outputTextArea = this.formatter?.elements?.outputText;
        if (outputTextArea) {
            outputTextArea.classList.remove('hl-active');
        }
    }

    /** Emergency wipe */
    forceClear() {
        const outputTextArea = this.formatter.elements.outputText;
        if (this.syntaxOverlay) {
            this.syntaxOverlay.innerHTML = '';
            this.syntaxOverlay.style.display = 'none';
        }
        if (outputTextArea) {
            outputTextArea.classList.remove('hl-active');
            outputTextArea.style.color = '';
        }
    }

    /* Stubs kept for compatibility */
    highlightError() { }
    clearErrorHighlighting() { }

    /** Cleanup */
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
