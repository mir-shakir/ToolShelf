/**
 * ToolShelf Text Transformer - Main Class (Updated with section reset and output stats)
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.TextTransformer = class TextTransformer extends window.ToolShelf.BaseTool {
    constructor() {
        super('text-transformer');

        // State management
        this.activeTransforms = new Set();
        this.lastInputValue = '';
        this.lastOutputValue = '';

        // DOM elements
        this.elements = {};

        // Performance tracking
        this.stats = {
            inputChars: 0,
            inputWords: 0,
            inputLines: 0,
            outputChars: 0,
            outputWords: 0,
            outputLines: 0,
            transformCount: 0
        };

        // Section mappings for reset functionality
        this.sectionMappings = {
            case: ['uppercase', 'lowercase', 'titlecase', 'sentencecase'],
            operations: ['reverse', 'trimWhitespace', 'removeEmptyLines', 'removeDuplicates'],
            lines: ['sortLines', 'sortLinesDesc', 'reverseLines']
        };

        this.init();
    }

    /**
     * Initialize the text transformer
     */
    init() {
        console.log('📝 Initializing Text Transformer...');

        try {
            this.initializeElements();
            this.initializeUI();
            this.registerKeyboardShortcuts();
            this.updateOutput(); // Initial update
            this.focusInput();

            super.init();
            console.log('✅ Text Transformer initialized successfully');
        } catch (error) {
            this.handleError(error, 'Failed to initialize Text Transformer');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        const elementIds = [
            'inputText', 'outputText', 'charCount', 'wordCount', 'lineCount',
            'outputCharCount', 'outputWordCount', 'outputLineCount',
            'transformStatus', 'changeIndicator', 'clearInput', 'clearInputOnly',
            'copyOutput', 'copyOutputTop', 'pasteBtn', 'downloadBtn', 'resetAll'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        // Get all transform controls
        this.elements.transformControls = document.querySelectorAll('[data-transform]');

        // Validate required elements
        if (!this.elements.inputText || !this.elements.outputText) {
            throw new Error('Required DOM elements not found');
        }

        console.log('🎯 DOM elements initialized');
    }

    /**
     * Initialize UI handlers
     */
    initializeUI() {
        // Initialize UI handlers with elements
        window.ToolShelf.TextTransformerUI.init(this.elements);

        // Set transformer reference in UI handlers
        window.ToolShelf.TextTransformerUI.setTransformer(this);

        console.log('🎨 UI handlers initialized');
    }

    /**
     * Register keyboard shortcuts for this tool
     */
    registerKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl+l', callback: () => this.clearInput(), description: 'Clear input' },
            { key: 'Ctrl+Enter', callback: () => this.copyOutput(), description: 'Copy output' },
            { key: 'Ctrl+d', callback: () => this.downloadOutput(), description: 'Download output' },
            { key: 'Ctrl+r', callback: () => this.resetAllTransformations(), description: 'Reset transformations' }
        ];

        this.registerShortcuts(shortcuts);
        console.log('⌨️ Keyboard shortcuts registered');
    }

    /**
     * Handle transform control changes with conflict resolution
     */
    handleTransformChange(control, transform) {
        const isChecked = control.checked || control.type === 'radio';
        const isRadio = control.type === 'radio';

        console.log(`🔄 Transform change: ${transform}, checked: ${isChecked}, type: ${control.type}`);

        if (isChecked) {
            // Handle radio button groups (mutually exclusive)
            if (isRadio) {
                const groupName = control.name.replace('-transform', '');
                const groupTransforms = window.ToolShelf.Constants.TRANSFORM_GROUPS[groupName] || [];

                // Remove other transforms in the same group
                groupTransforms.forEach(t => {
                    if (t !== transform) {
                        this.activeTransforms.delete(t);
                    }
                });
            }

            this.activeTransforms.add(transform);
        } else {
            this.activeTransforms.delete(transform);
        }

        this.updateOutput();
        window.ToolShelf.TextTransformerUI.showTransformFeedback(transform, isChecked);
    }

    /**
     * Reset specific section transformations
     */
    resetSection(section) {
        console.log(`🔄 Resetting section: ${section}`);

        const sectionTransforms = this.sectionMappings[section] || [];

        // Remove all transforms in this section
        sectionTransforms.forEach(transform => {
            this.activeTransforms.delete(transform);
        });

        // Update UI controls for this section
        sectionTransforms.forEach(transform => {
            const control = document.querySelector(`[data-transform="${transform}"]`);
            if (control) {
                control.checked = false;
            }
        });

        this.updateOutput();
        this.showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} transformations reset`, 'success', 2000);
    }

    /**
     * Update the output with all transformations
     */
    updateOutput() {
        return this.measurePerformance('updateOutput', () => {
            try {
                let text = this.elements.inputText.value;
                const originalText = text;

                // Validate text limits
                const limits = window.ToolShelf.Utils.checkTextLimits(text);
                if (!limits.valid) {
                    this.showToast(
                        `Text too large: ${limits.textLength}/${limits.maxTextLength} chars`,
                        'warning'
                    );
                    return;
                }

                // Update input statistics
                this.updateInputStats(text);

                // Apply transformations
                if (this.activeTransforms.size > 0) {
                    const transforms = this.getOrderedTransforms();
                    text = window.ToolShelf.TextTransforms.applyMultiple(text, transforms);
                }

                // Update output
                this.elements.outputText.value = text;

                // Update output statistics
                this.updateOutputStats(text);

                // Update UI elements
                this.updateUIElements(originalText, text);

                // Store for change detection
                this.lastInputValue = originalText;
                this.lastOutputValue = text;

                this.stats.transformCount++;

            } catch (error) {
                this.handleError(error, 'Error applying transformations');
            }
        });
    }

    /**
     * Get transforms in the correct order
     */
    getOrderedTransforms() {
        const order = window.ToolShelf.Constants.TRANSFORM_ORDER;
        return order.filter(transform => this.activeTransforms.has(transform));
    }

    /**
     * Update input statistics
     */
    updateInputStats(text) {
        // Calculate stats
        const charCount = text.length;
        const wordCount = text.trim() === '' ? 0 :
            text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const lineCount = text === '' ? 0 : text.split('\n').length;

        // Store stats
        this.stats.inputChars = charCount;
        this.stats.inputWords = wordCount;
        this.stats.inputLines = lineCount;

        // Update UI - just input stats for now
        window.ToolShelf.TextTransformerUI.updateStats({
            chars: charCount,
            words: wordCount,
            lines: lineCount
        });
    }

    /**
     * Update output statistics
     */
    updateOutputStats(text) {
        // Calculate stats
        const charCount = text.length;
        const wordCount = text.trim() === '' ? 0 :
            text.trim().split(/\s+/).filter(word => word.length > 0).length;
        const lineCount = text === '' ? 0 : text.split('\n').length;

        // Store stats
        this.stats.outputChars = charCount;
        this.stats.outputWords = wordCount;
        this.stats.outputLines = lineCount;

        // Update UI with both input and output stats
        window.ToolShelf.TextTransformerUI.updateStats(
            {
                chars: this.stats.inputChars,
                words: this.stats.inputWords,
                lines: this.stats.inputLines
            },
            {
                chars: charCount,
                words: wordCount,
                lines: lineCount
            }
        );
    }

    /**
     * Update all UI elements
     */
    updateUIElements(originalText, transformedText) {
        const hasChanges = originalText !== transformedText ||
            this.lastInputValue !== originalText;
        const hasOutput = transformedText.trim().length > 0;

        // Update status and indicators
        window.ToolShelf.TextTransformerUI.updateTransformStatus(this.activeTransforms);
        window.ToolShelf.TextTransformerUI.updateChangeIndicator(hasChanges);
        window.ToolShelf.TextTransformerUI.updateCopyButtonStates(hasOutput);
    }

    /**
     * Clear all input and reset transformations
     */
    clearAll() {
        this.clearInput();
        this.resetAllTransformations();
        this.showToast('Everything cleared', 'success', 2000);
    }

    /**
     * Clear only input text
     */
    clearInput() {
        this.elements.inputText.value = '';
        this.updateOutput();
        this.focusInput();
        this.showToast('Input cleared', 'success', 1500);
    }

    /**
     * Focus input with cursor at end
     */
    focusInput() {
        window.ToolShelf.TextTransformerUI.focusInput();
    }

    /**
     * Paste from clipboard
     */
    async pasteFromClipboard() {
        try {
            let text = '';

            if (navigator.clipboard && window.isSecureContext) {
                text = await navigator.clipboard.readText();
            } else {
                // Fallback - focus input and let user paste manually
                this.focusInput();
                this.showToast('Please paste manually (Ctrl+V)', 'info', 3000);
                return;
            }

            if (text) {
                // Check limits before pasting
                const limits = window.ToolShelf.Utils.checkTextLimits(text);
                if (!limits.valid) {
                    this.showToast(
                        `Text too large to paste: ${limits.textLength}/${limits.maxTextLength} chars`,
                        'error'
                    );
                    return;
                }

                this.elements.inputText.value = text;
                this.updateOutput();
                this.showToast(`Pasted ${text.length} characters from clipboard`, 'success', 2000);
            } else {
                this.showToast('Clipboard is empty', 'info', 2000);
            }

        } catch (error) {
            this.handleError(error, 'Could not paste from clipboard');
        }
    }

    /**
     * Copy output to clipboard with enhanced feedback
     */
    async copyOutput() {
        const outputText = this.elements.outputText.value;

        if (!outputText.trim()) {
            this.showToast('No text to copy', 'error', 2000);
            return;
        }

        try {
            const success = await window.ToolShelf.Utils.copyToClipboard(outputText);

            if (success) {
                const charCount = outputText.length;
                const lineCount = outputText.split('\n').length;
                this.showToast(
                    `Copied ${window.ToolShelf.Utils.formatNumber(charCount)} characters ` +
                    `(${window.ToolShelf.Utils.formatNumber(lineCount)} lines) to clipboard!`,
                    'success'
                );

                // Visual feedback on buttons
                this.showCopySuccessAnimation();
            } else {
                throw new Error('Copy operation failed');
            }
        } catch (error) {
            this.handleError(error, 'Failed to copy. Please select text manually.');
        }
    }

    /**
     * Show copy success animation
     */
    showCopySuccessAnimation() {
        const buttons = [this.elements.copyOutput, this.elements.copyOutputTop];

        buttons.forEach(btn => {
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.style.background = 'var(--success-color)';
                btn.style.borderColor = 'var(--success-color)';

                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = '';
                    btn.style.borderColor = '';
                }, 2000);
            }
        });
    }

    /**
     * Download output as text file
     */
    async downloadOutput() {
        const outputText = this.elements.outputText.value;

        if (!outputText.trim()) {
            this.showToast('No text to download', 'error', 2000);
            return;
        }

        try {
            const timestamp = window.ToolShelf.Utils.getTimestamp();
            const transformsUsed = Array.from(this.activeTransforms).join('-');
            const baseFilename = transformsUsed ?
                `toolshelf-${transformsUsed}-${timestamp}` :
                `toolshelf-text-${timestamp}`;
            const filename = `${baseFilename}.txt`;

            const success = await window.ToolShelf.Utils.downloadTextFile(outputText, filename);

            if (success) {
                this.showToast(`Downloaded as ${filename}`, 'success');
            } else {
                throw new Error('Download operation failed');
            }
        } catch (error) {
            this.handleError(error, 'Failed to download file');
        }
    }

    /**
     * Reset all transformations
     */
    resetAllTransformations() {
        // Clear all active transforms
        this.activeTransforms.clear();

        // Reset all checkboxes and radio buttons
        this.elements.transformControls.forEach(control => {
            control.checked = false;
        });

        this.updateOutput();
        this.showToast('All transformations reset', 'success', 2000);
    }

    /**
     * Save current state
     */
    saveState() {
        try {
            const state = this.exportState();
            window.ToolShelf.Utils.storage.set('text_transformer_state', state);
        } catch (error) {
            console.warn('Could not save state:', error);
        }
    }

    /**
     * Load saved state
     */
    loadState() {
        try {
            const state = window.ToolShelf.Utils.storage.get('text_transformer_state');
            if (state) {
                this.importState(state);
                this.showToast('Previous session restored', 'info', 2000);
            }
        } catch (error) {
            console.warn('Could not load state:', error);
        }
    }

    /**
     * Export current state
     */
    exportState() {
        const baseState = super.exportState();

        return {
            ...baseState,
            input: this.elements.inputText.value,
            output: this.elements.outputText.value,
            activeTransforms: Array.from(this.activeTransforms),
            stats: { ...this.stats },
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Import state
     */
    importState(state) {
        try {
            super.importState(state);

            // Restore input text
            if (state.input !== undefined) {
                this.elements.inputText.value = state.input;
            }

            // Restore active transforms
            if (state.activeTransforms) {
                this.activeTransforms = new Set(state.activeTransforms);

                // Update UI controls to match state
                this.elements.transformControls.forEach(control => {
                    const transform = control.getAttribute('data-transform');
                    control.checked = this.activeTransforms.has(transform);
                });
            }

            // Restore stats if available
            if (state.stats) {
                this.stats = { ...this.stats, ...state.stats };
            }

            // Update output to reflect restored state
            this.updateOutput();

            console.log('📥 Text Transformer state imported successfully');
        } catch (error) {
            this.handleError(error, 'Failed to import state');
        }
    }

    /**
     * Get transformation summary for display
     */
    getTransformationSummary() {
        if (this.activeTransforms.size === 0) {
            return 'No transformations applied';
        }

        const transforms = Array.from(this.activeTransforms).map(transform =>
            window.ToolShelf.Constants.TRANSFORM_DISPLAY_NAMES[transform] || transform
        );

        return `Applied: ${transforms.join(', ')}`;
    }

    /**
     * Called when tool becomes visible
     */
    onShow() {
        super.onShow();
        this.focusInput();

        // Log performance metrics
        const perfStats = this.getPerformanceStats();
        if (perfStats.operationsCount > 0) {
            console.log(`📊 Text Transformer Performance:`, perfStats);
        }

        // Update UI to ensure everything is in sync
        this.updateOutput();
    }

    /**
     * Called when tool becomes hidden
     */
    onHide() {
        super.onHide();

        // Save current state to localStorage for recovery
        this.saveState();
    }

    /**
     * Get comprehensive tool statistics
     */
    getToolStats() {
        const baseStats = this.getPerformanceStats();

        return {
            ...baseStats,
            currentStats: { ...this.stats },
            activeTransforms: Array.from(this.activeTransforms),
            transformsAvailable: window.ToolShelf.TextTransforms.getAvailableTransforms().length,
            inputLength: this.elements.inputText.value.length,
            outputLength: this.elements.outputText.value.length,
            hasChanges: this.lastInputValue !== this.elements.inputText.value ||
                this.lastOutputValue !== this.elements.outputText.value,
            sectionsAvailable: Object.keys(this.sectionMappings)
        };
    }

    /**
     * Cleanup when tool is destroyed
     */
    destroy() {
        // Save state before destroying
        this.saveState();

        // Unregister shortcuts
        this.unregisterShortcuts();

        // Clear references
        this.elements = {};
        this.activeTransforms.clear();

        super.destroy();
        console.log('🗑️ Text Transformer destroyed');
    }

    /**
     * Handle app-level events
     */
    handleAppEvent(eventType, data) {
        switch (eventType) {
            case 'beforeUnload':
                this.saveState();
                break;
            case 'online':
                this.showToast('Connection restored - all features available', 'success', 2000);
                break;
            case 'offline':
                this.showToast('Working offline - all features still work', 'info', 3000);
                break;
            default:
                console.log(`📨 Unhandled app event: ${eventType}`, data);
        }
    }

    /**
     * Get statistics comparison between input and output
     */
    getStatsComparison() {
        return {
            chars: {
                input: this.stats.inputChars,
                output: this.stats.outputChars,
                difference: this.stats.outputChars - this.stats.inputChars
            },
            words: {
                input: this.stats.inputWords,
                output: this.stats.outputWords,
                difference: this.stats.outputWords - this.stats.inputWords
            },
            lines: {
                input: this.stats.inputLines,
                output: this.stats.outputLines,
                difference: this.stats.outputLines - this.stats.inputLines
            }
        };
    }

    /**
     * Debug method to log current state
     */
    debugCurrentState() {
        console.log('🐛 Current Text Transformer State:', {
            activeTransforms: Array.from(this.activeTransforms),
            stats: this.stats,
            comparison: this.getStatsComparison(),
            performance: this.getPerformanceStats(),
            hasInput: this.elements.inputText.value.length > 0,
            hasOutput: this.elements.outputText.value.length > 0
        });
    }
};
function toggleSeoContent() {
    const seoContent = document.getElementById('seo-content');
    seoContent.classList.toggle('expanded');
}

function toggleFooterContent() {
    const footerContent = document.getElementById('seo-footer');
    footerContent.classList.toggle('visible');
}

// Simple analytics placeholder
function trackEvent(event, data) {
    console.log('Event:', event, data);
}

// Footer link handlers
function showPrivacyInfo() {
    alert('ToolShelf respects your privacy. All text processing happens locally in your browser. No data is collected or sent to any servers.');
}

function showTermsInfo() {
    alert('ToolShelf is provided as-is for free use. Use responsibly and at your own risk.');
}

function showContactInfo() {
    alert('For questions or feedback, please visit our GitHub repository or create an issue.');
}

// Track page views (placeholder for real analytics)
if (typeof gtag !== 'undefined') {
    gtag('config', 'G-GBY4766X5D', {
        page_title: 'ToolShelf - Text Transformer',
        page_location: window.location.href
    });
}