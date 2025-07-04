/**
 * ToolShelf JSON Formatter - Main Class
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.JSONFormatter = class JSONFormatter extends window.ToolShelf.BaseTool {
    constructor() {
        super('json-formatter');

        // State management
        this.currentIndentation = 2;
        this.sortKeys = false;
        this.enableSyntaxHighlighting = true;
        this.autoValidate = true;
        this.currentOperation = 'format';

        // JSON data state
        this.jsonData = null;
        this.validationResult = {
            isValid: false,
            error: null,
            stats: { size: 0, depth: 0, keys: 0, arrays: 0, objects: 0 }
        };

        // DOM elements
        this.elements = {};

        // Component references
        this.validator = null;
        this.highlighter = null;
        this.operations = null;
        this.pathHandler = null;
        this.uiHandlers = null;

        // Performance tracking
        this.stats = {
            inputChars: 0,
            inputBytes: 0,
            outputChars: 0,
            outputBytes: 0,
            validationsCount: 0,
            formattingCount: 0
        };

        this.init();
    }

    /**
     * Initialize the JSON formatter
     */
    init() {
        console.log('📄 Initializing JSON Formatter...');

        try {
            this.initializeElements();
            this.initializeComponents();
            this.initializeUI();
            // this.registerKeyboardShortcuts();
            this.updateOutput(); // Initial state

            super.init();
            console.log('✅ JSON Formatter initialized successfully');
        } catch (error) {
            this.handleError(error, 'Failed to initialize JSON Formatter');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        const elementIds = [
            'inputText', 'outputText', 'inputCharCount', 'inputBytes',
            'outputCharCount', 'outputBytes', 'validationStatus',
            'errorDisplay', 'pasteBtn', 'clearInput', 'copyOutput',
            'downloadOutput', 'resetAll', 'jsonPathInput', 'jsonPathResult'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        // Quick action buttons
        this.elements.formatBtn = document.getElementById('formatBtn');
        this.elements.minifyBtn = document.getElementById('minifyBtn');
        this.elements.validateBtn = document.getElementById('validateBtn');
        this.elements.sortKeysBtn = document.getElementById('sortKeysBtn');

        // Format options
        this.elements.indentationOptions = document.querySelectorAll('input[name="json-indentation"]');
        this.elements.advancedOptions = document.querySelectorAll('.advanced-option input');

        // Advanced toggle
        this.elements.advancedToggle = document.getElementById('advancedToggle');
        this.elements.advancedSection = document.getElementById('advancedSection');

        // JSON stats elements
        this.elements.jsonDepth = document.getElementById('jsonDepth');
        this.elements.jsonKeys = document.getElementById('jsonKeys');
        this.elements.jsonArrays = document.getElementById('jsonArrays');
        this.elements.jsonObjects = document.getElementById('jsonObjects');

        // Validate required elements
        if (!this.elements.inputText || !this.elements.outputText) {
            throw new Error('Required DOM elements not found');
        }

        console.log('🎯 JSON DOM elements initialized');
    }

    /**
     * Initialize component modules
     */
    initializeComponents() {
        // Initialize validator
        this.validator = new window.ToolShelf.JSONValidator(this);

        // Initialize syntax highlighter
        this.highlighter = new window.ToolShelf.JSONSyntaxHighlighter(this);

        // Initialize operations handler
        this.operations = new window.ToolShelf.JSONOperations(this);

        // Initialize JSONPath handler
        this.pathHandler = new window.ToolShelf.JSONPathHandler(this);

        console.log('🔧 JSON components initialized');
    }

    /**
     * Initialize UI handlers
     */
    initializeUI() {
        this.uiHandlers = new window.ToolShelf.JSONUIHandlers(this);
        console.log('🎨 JSON UI handlers initialized');
    }

    // /**
    //  * Register keyboard shortcuts
    //  */
    // registerKeyboardShortcuts() {
    //     const shortcuts = [
    //         { key: 'Ctrl+f', callback: () => this.formatJSON(), description: 'Format JSON' },
    //         { key: 'Ctrl+m', callback: () => this.minifyJSON(), description: 'Minify JSON' },
    //         { key: 'Ctrl+v', callback: () => this.validateJSON(), description: 'Validate JSON' },
    //         { key: 'Ctrl+k', callback: () => this.toggleSortKeys(), description: 'Toggle sort keys' },
    //         { key: 'Ctrl+l', callback: () => this.clearInput(), description: 'Clear input' },
    //         { key: 'Ctrl+Enter', callback: () => this.copyOutput(), description: 'Copy output' },
    //         { key: 'Ctrl+d', callback: () => this.downloadOutput(), description: 'Download output' },
    //         { key: 'Ctrl+r', callback: () => this.resetAll(), description: 'Reset all' }
    //     ];

    //     this.registerShortcuts(shortcuts);
    //     console.log('⌨️ JSON keyboard shortcuts registered');
    // }

    registerKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl+f', callback: () => this.formatJSON(), description: 'Format JSON' },
            { key: 'Ctrl+m', callback: () => this.minifyJSON(), description: 'Minify JSON' },
            { key: 'Ctrl+shift+v', callback: () => this.validateJSON(), description: 'Validate JSON' }, // Changed from Ctrl+v
            { key: 'Ctrl+k', callback: () => this.toggleSortKeys(), description: 'Toggle sort keys' },
            { key: 'Ctrl+l', callback: () => this.clearInput(), description: 'Clear input' },
            { key: 'Ctrl+Enter', callback: () => this.copyOutput(), description: 'Copy output' },
            { key: 'Ctrl+d', callback: () => this.downloadOutput(), description: 'Download output' },
            { key: 'Ctrl+r', callback: () => this.resetAll(), description: 'Reset all' },
            { key: 'Ctrl+v', callback: () => this.pasteFromClipboard(), description: 'Paste from clipboard' } // Add paste shortcut
        ];

        this.registerShortcuts(shortcuts);
        console.log('⌨️ JSON keyboard shortcuts registered');
    }

    /**
     * Main update function - processes input and updates output
     */
    updateOutput() {
        return this.measurePerformance('updateOutput', () => {
            try {
                const input = this.elements.inputText.value;

                // Update input statistics
                this.updateInputStats(input);

                if (!input.trim()) {
                    // Handle empty input properly
                    this.handleEmptyInput();
                    return;
                }

                // Auto-validate if enabled
                if (this.autoValidate) {
                    this.validator.validateJSON(true);
                }

                // Apply current operation
                this.applyCurrentOperation();
                this.updateButtonStates();

            } catch (error) {
                this.handleError(error, 'Error processing JSON');
            }
        });
    }


    /**
     * Handle empty input state properly
     */
    // Add this method to your JSONFormatter class

    /**
     * Handle empty input state properly without cursor interference
     */
    handleEmptyInput() {
        // Store if input is focused
        const inputFocused = document.activeElement === this.elements.inputText;
        const cursorPos = inputFocused ? this.elements.inputText.selectionStart : 0;

        // Clear output
        this.elements.outputText.value = '';
        this.elements.outputText.classList.remove('has-content');

        // Clear syntax highlighting without affecting input
        if (this.highlighter) {
            this.highlighter.clearHighlighting();
        }

        // Hide error display
        if (this.validator) {
            this.validator.hideValidationError();
            this.validator.resetValidationStatus();
        }

        // Clear JSONPath result
        if (this.pathHandler) {
            this.pathHandler.clearResult();
        }

        // Reset state
        this.jsonData = null;
        this.validationResult = {
            isValid: false,
            error: null,
            stats: { size: 0, depth: 0, keys: 0, arrays: 0, objects: 0 }
        };

        // Update stats and buttons
        this.updateOutputStats('');
        this.updateButtonStates();

        // Restore focus and cursor if it was focused
        if (inputFocused) {
            setTimeout(() => {
                this.elements.inputText.focus();
                this.elements.inputText.setSelectionRange(cursorPos, cursorPos);
            }, 0);
        }

        console.log('📝 Input cleared - state reset');
    }

    /**
     * Apply current operation (format, minify, etc.)
     */
    applyCurrentOperation() {
        const input = this.elements.inputText.value.trim();
        if (!input) return;

        try {
            switch (this.currentOperation) {
                case 'format':
                    this.formatJSON(true);
                    break;
                case 'minify':
                    this.minifyJSON(true);
                    break;
                case 'validate':
                    this.validateJSON(true);
                    break;
                default:
                    this.formatJSON(true);
            }
        } catch (error) {
            this.validator.showValidationError(error);
        }
    }

    /**
     * Format JSON - delegates to operations handler
     */
    formatJSON(isAuto = false) {
        return this.operations.formatJSON(isAuto);
    }

    /**
     * Minify JSON - delegates to operations handler
     */
    minifyJSON(isAuto = false) {
        return this.operations.minifyJSON(isAuto);
    }

    /**
     * Validate JSON - delegates to validator
     */
    validateJSON(isAuto = false) {
        return this.validator.validateJSON(isAuto);
    }

    /**
     * Toggle sort keys option
     */
    toggleSortKeys() {
        this.sortKeys = !this.sortKeys;
        this.operations.updateSortKeysButton();
        this.updateOutput();
        this.showToast(`Key sorting ${this.sortKeys ? 'enabled' : 'disabled'}`, 'info');
    }

    /**
     * Update input statistics
     */
    updateInputStats(text) {
        const charCount = text.length;
        const byteCount = new Blob([text]).size;

        this.stats.inputChars = charCount;
        this.stats.inputBytes = byteCount;

        if (this.elements.inputCharCount) {
            this.elements.inputCharCount.textContent = charCount.toLocaleString();
        }
        if (this.elements.inputBytes) {
            this.elements.inputBytes.textContent = byteCount.toLocaleString();
        }
    }

    /**
     * Update output statistics
     */
    updateOutputStats(text) {
        const charCount = text.length;
        const byteCount = new Blob([text]).size;

        this.stats.outputChars = charCount;
        this.stats.outputBytes = byteCount;

        if (this.elements.outputCharCount) {
            this.elements.outputCharCount.textContent = charCount.toLocaleString();
        }
        if (this.elements.outputBytes) {
            this.elements.outputBytes.textContent = byteCount.toLocaleString();
        }
    }

    /**
     * Update button states
     */
    updateButtonStates() {
        const hasOutput = this.elements.outputText.value.length > 0;

        if (this.elements.copyOutput) {
            this.elements.copyOutput.disabled = !hasOutput;
        }
        if (this.elements.downloadOutput) {
            this.elements.downloadOutput.disabled = !hasOutput;
        }
    }

    /**
     * Clear input and reset state
     */
    /**
 * Clear input and reset state properly
 */
    clearInput() {
        // Clear input
        this.elements.inputText.value = '';
        this.elements.inputText.classList.remove('input-error');

        // Clear output completely
        this.elements.outputText.value = '';
        this.elements.outputText.classList.remove('has-content');

        // Clear syntax highlighting
        this.highlighter.clearHighlighting();

        // Clear JSONPath
        this.pathHandler.clearResult();
        if (this.elements.jsonPathInput) {
            this.elements.jsonPathInput.value = '';
        }

        // Hide error display
        this.validator.hideValidationError();

        // Reset state
        this.jsonData = null;
        this.validationResult = {
            isValid: false,
            error: null,
            stats: { size: 0, depth: 0, keys: 0, arrays: 0, objects: 0 }
        };

        // Update UI
        this.updateInputStats('');
        this.updateOutputStats('');
        this.validator.resetValidationStatus();
        this.updateButtonStates();

        // Focus input
        this.elements.inputText.focus();

        this.showToast('Input cleared', 'success');
    }

    /**
     * Paste from clipboard
     */
    /**
 * Paste from clipboard with better error handling
 */
    async pasteFromClipboard() {
        try {
            // Check if clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                this.showToast('Clipboard access not available. Please paste manually (Ctrl+V in the text area).', 'warning');
                this.elements.inputText.focus();
                return;
            }

            const text = await navigator.clipboard.readText();
            if (text) {
                this.elements.inputText.value = text;
                this.updateOutput();
                this.showToast(`Pasted ${text.length.toLocaleString()} characters from clipboard`, 'success');
            } else {
                this.showToast('Clipboard is empty', 'info');
            }
        } catch (error) {
            // Handle permission denial gracefully
            if (error.name === 'NotAllowedError') {
                this.showToast('Clipboard access denied. Please paste manually with Ctrl+V in the text area.', 'info');
                this.elements.inputText.focus();
            } else {
                this.showToast('Could not access clipboard. Please paste manually.', 'warning');
                this.elements.inputText.focus();
            }
        }
    }

    /**
     * Copy output to clipboard
     */
    async copyOutput() {
        const outputText = this.elements.outputText.value;

        if (!outputText) {
            this.showToast('No output to copy', 'error');
            return;
        }

        try {
            const success = await window.ToolShelf.Utils.copyToClipboard(outputText);

            if (success) {
                this.showToast(
                    `Copied ${outputText.length.toLocaleString()} characters to clipboard!`,
                    'success'
                );
            } else {
                throw new Error('Copy operation failed');
            }
        } catch (error) {
            this.handleError(error, 'Failed to copy output');
        }
    }

    /**
     * Download output as file
     */
    downloadOutput() {
        const outputText = this.elements.outputText.value;

        if (!outputText) {
            this.showToast('No output to download', 'error');
            return;
        }

        try {
            const timestamp = window.ToolShelf.Utils.getTimestamp();
            const operation = this.currentOperation;
            const filename = `toolshelf-json-${operation}-${timestamp}.json`;

            const success = window.ToolShelf.Utils.downloadTextFile(outputText, filename);

            if (success) {
                this.showToast(`Downloaded as ${filename}`, 'success');
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            this.handleError(error, 'Failed to download file');
        }
    }

    /**
     * Reset all settings
     */
    resetAll() {
        // Store current input/output to preserve them
        const currentInput = this.elements.inputText.value;
        const currentOutput = this.elements.outputText.value;

        // Reset options to defaults
        this.currentIndentation = 2;
        this.sortKeys = false;
        this.currentOperation = 'format';

        // Reset UI controls to defaults
        const defaultIndentOption = document.querySelector('input[name="json-indentation"][value="2"]');
        if (defaultIndentOption) {
            defaultIndentOption.checked = true;
        }

        // Update sort keys button to reflect disabled state
        this.operations.updateSortKeysButton();

        // Reset advanced options to their default states
        this.elements.advancedOptions.forEach(option => {
            option.checked = option.defaultChecked;
        });

        // Reset button states
        this.updateButtonStates();

        // If we had valid input, re-process it with the reset settings
        if (currentInput.trim()) {
            // Keep the input
            this.elements.inputText.value = currentInput;

            // Re-validate and format with new settings
            this.updateOutput();
        } else {
            // If input was empty, ensure everything is clean
            this.elements.outputText.value = '';
            this.resetValidationStatus();
        }

        // Clear any error states
        this.validator.hideValidationError();
        this.elements.inputText.classList.remove('input-error');

        this.showToast('Settings reset to defaults', 'success');
    }

    /**
     * Export state
     */
    exportState() {
        const baseState = super.exportState();

        return {
            ...baseState,
            input: this.elements.inputText.value,
            output: this.elements.outputText.value,
            currentIndentation: this.currentIndentation,
            sortKeys: this.sortKeys,
            enableSyntaxHighlighting: this.enableSyntaxHighlighting,
            autoValidate: this.autoValidate,
            currentOperation: this.currentOperation,
            stats: { ...this.stats }
        };
    }

    /**
     * Import state
     */
    importState(state) {
        try {
            super.importState(state);

            if (state.input !== undefined) {
                this.elements.inputText.value = state.input;
            }

            if (state.currentIndentation !== undefined) {
                this.currentIndentation = state.currentIndentation;
            }

            if (state.sortKeys !== undefined) {
                this.sortKeys = state.sortKeys;
            }

            if (state.stats) {
                this.stats = { ...this.stats, ...state.stats };
            }

            this.updateOutput();
            console.log('📥 JSON Formatter state imported successfully');

        } catch (error) {
            this.handleError(error, 'Failed to import state');
        }
    }

    /**
     * Tool becomes visible
     */
    onShow() {
        super.onShow();
        this.elements.inputText.focus();
    }

    /**
     * Tool becomes hidden
     */
    onHide() {
        super.onHide();
        const state = this.exportState();
        window.ToolShelf.Utils.storage.set('json_formatter_state', state);
    }

    /**
     * Get tool statistics
     */
    getToolStats() {
        const baseStats = this.getPerformanceStats();

        return {
            ...baseStats,
            stats: { ...this.stats },
            validationResult: this.validationResult,
            currentOperation: this.currentOperation,
            settings: {
                indentation: this.currentIndentation,
                sortKeys: this.sortKeys,
                syntaxHighlighting: this.enableSyntaxHighlighting,
                autoValidate: this.autoValidate
            }
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        const state = this.exportState();
        window.ToolShelf.Utils.storage.set('json_formatter_state', state);

        this.unregisterShortcuts();

        // Cleanup components
        if (this.validator) this.validator.destroy();
        if (this.highlighter) this.highlighter.destroy();
        if (this.operations) this.operations.destroy();
        if (this.pathHandler) this.pathHandler.destroy();
        if (this.uiHandlers) this.uiHandlers.destroy();

        this.elements = {};
        this.jsonData = null;

        super.destroy();
        console.log('🗑️ JSON Formatter destroyed');
    }

    /**
 * Debug method to check highlighting state 
 */
    debugHighlightingState() {
        const input = this.elements.inputText.value;
        const output = this.elements.outputText.value;
        const hasContentClass = this.elements.outputText.classList.contains('has-content');
        const overlayDisplay = this.highlighter.syntaxOverlay ? this.highlighter.syntaxOverlay.style.display : 'none';

        console.log('🐛 Debug Highlighting State:', {
            inputLength: input.length,
            outputLength: output.length,
            hasContentClass,
            overlayDisplay,
            overlayHTML: this.highlighter.syntaxOverlay ? this.highlighter.syntaxOverlay.innerHTML.length : 0
        });
    }
};