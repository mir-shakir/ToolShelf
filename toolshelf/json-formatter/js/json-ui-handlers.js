/**
 * ToolShelf JSON UI Handlers - UI Event Handling Module
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.JSONUIHandlers = class JSONUIHandlers {
    constructor(formatter) {
        this.formatter = formatter;
        this.setupEventListeners();
        this.setupDebouncedFunctions();
        this.setupFileDragDrop(); // Add this
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        const { elements } = this.formatter;

        // Input text changes with real-time processing
        if (elements.inputText) {
            // Use addEventListener directly on the element
            elements.inputText.addEventListener('input', (e) => {
                this.onInputChange(e);
            });

            elements.inputText.addEventListener('paste', (e) => {
                // Handle paste with slight delay to ensure content is pasted
                setTimeout(() => this.onInputChange(e), 50);
            });

            elements.inputText.addEventListener('keyup', (e) => {
                // Handle deletions and other key events that might clear content
                this.onInputChange(e);
            });

            elements.inputText.addEventListener('focus', () => {
                this.onInputFocus();
            });

            elements.inputText.addEventListener('keydown', (e) => {
                this.onInputKeydown(e);
            });

            console.log('✅ Input text area event listeners attached');
        } else {
            console.error('❌ Input text area not found!');
        }

        // Rest of the setup...
        this.setupQuickActionButtons();
        this.setupFormatOptions();
        this.setupAdvancedOptions();
        this.setupPanelButtons();
        this.setupJsonPathHandlers();

        console.log('🎨 JSON UI event listeners setup complete');
    }

    /**
     * Setup debounced functions for performance
     */
    setupDebouncedFunctions() {
        this.debouncedUpdate = this.debounce(() => {
            this.formatter.updateOutput();
        }, 300);

        this.debouncedValidate = this.debounce(() => {
            this.formatter.validateJSON(true);
        }, 200);

        this.debouncedJsonPath = this.debounce(() => {
            this.formatter.pathHandler.executeJsonPath();
        }, 300);
    }

    /**
     * Simple debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Setup quick action button handlers
     */
    setupQuickActionButtons() {
        const { elements } = this.formatter;

        // Format button
        if (elements.formatBtn) {
            elements.formatBtn.addEventListener('click', () => {
                this.onFormatClick();
            });
        }

        // Minify button
        if (elements.minifyBtn) {
            elements.minifyBtn.addEventListener('click', () => {
                this.onMinifyClick();
            });
        }

        // Validate button
        if (elements.validateBtn) {
            elements.validateBtn.addEventListener('click', () => {
                this.onValidateClick();
            });
        }

        // Sort keys button
        if (elements.sortKeysBtn) {
            elements.sortKeysBtn.addEventListener('click', () => {
                this.onSortKeysClick();
            });
        }
    }

    /**
     * Setup format option handlers
     */
    setupFormatOptions() {
        const { elements } = this.formatter;

        // Indentation options
        if (elements.indentationOptions) {
            elements.indentationOptions.forEach(option => {
                option.addEventListener('change', () => {
                    this.onIndentationChange(option);
                });
            });
        }
    }

    /**
     * Setup advanced option handlers
     */
    setupAdvancedOptions() {
        const { elements } = this.formatter;

        if (elements.advancedOptions) {
            elements.advancedOptions.forEach(option => {
                option.addEventListener('change', () => {
                    this.onAdvancedOptionChange(option);
                });
            });
        }

        // Advanced section toggle
        if (elements.advancedToggle) {
            elements.advancedToggle.addEventListener('click', () => {
                this.toggleAdvancedSection();
            });
        }
    }

    /**
     * Setup panel button handlers
     */
    setupPanelButtons() {
        const { elements } = this.formatter;

        // Panel action buttons
        const buttonHandlers = {
            pasteBtn: () => this.formatter.pasteFromClipboard(),
            clearInput: () => this.formatter.clearInput(),
            copyOutput: () => this.formatter.copyOutput(),
            downloadOutput: () => this.formatter.downloadOutput(),
            resetAll: () => this.formatter.resetAll()
        };

        Object.entries(buttonHandlers).forEach(([id, handler]) => {
            const element = elements[id];
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    /**
     * Setup JSONPath handlers
     */
    setupJsonPathHandlers() {
        const { elements } = this.formatter;

        // JSONPath input
        if (elements.jsonPathInput) {
            elements.jsonPathInput.addEventListener('input', () => {
                this.debouncedJsonPath();
            });

            elements.jsonPathInput.addEventListener('keydown', (e) => {
                this.onJsonPathKeydown(e);
            });
        }
    }

    /**
    * Handle input text changes with better empty state handling
    */
    onInputChange(e) {
        // Use debounced update for performance
        this.debouncedUpdate();

        // If input is now empty, force clear the highlighting immediately
        const inputValue = this.formatter.elements.inputText.value;
        if (!inputValue.trim()) {
            // Force immediate cleanup for empty input
            setTimeout(() => {
                this.formatter.highlighter.forceClear();
            }, 10);
        }
    }

    /**
     * Handle input focus
     */
    onInputFocus() {
        // Clear any previous error highlighting
        if (this.formatter.highlighter) {
            this.formatter.highlighter.clearErrorHighlighting();
        }
    }

    /**
     * Handle format button click
     */
    onFormatClick() {
        const input = this.formatter.elements.inputText.value.trim();

        if (!input) {
            this.formatter.showToast('Please enter JSON to format', 'warning');
            this.focusInput();
            return;
        }

        // Validate first
        const isValid = this.formatter.validator.validateJSON(true);
        if (!isValid) {
            this.formatter.showToast('Cannot format invalid JSON. Please fix errors first.', 'error');
            return;
        }

        this.formatter.currentOperation = 'format';
        this.updateOperationButtonStates('format');

        // Call the format operation
        const success = this.formatter.operations.formatJSON();
        if (!success) {
            this.formatter.showToast('Formatting failed', 'error');
        }
    }

    /**
     * Handle minify button click
     */
    onMinifyClick() {
        const input = this.formatter.elements.inputText.value.trim();

        if (!input) {
            this.formatter.showToast('Please enter JSON to minify', 'warning');
            this.focusInput();
            return;
        }

        // Validate first
        const isValid = this.formatter.validator.validateJSON(true);
        if (!isValid) {
            this.formatter.showToast('Cannot minify invalid JSON. Please fix errors first.', 'error');
            return;
        }

        this.formatter.currentOperation = 'minify';
        this.updateOperationButtonStates('minify');

        // Call the minify operation
        const success = this.formatter.operations.minifyJSON();
        if (!success) {
            this.formatter.showToast('Minification failed', 'error');
        }
    }

    onValidateClick() {
        const input = this.formatter.elements.inputText.value.trim();

        if (!input) {
            this.formatter.showToast('Please enter JSON to validate', 'warning');
            this.focusInput();
            return;
        }

        const isValid = this.formatter.validateJSON();

        if (isValid) {
            // If valid, also format it in the output
            this.formatter.currentOperation = 'format';
            this.formatter.operations.formatJSON(true);

            const stats = this.formatter.validationResult.stats;
            this.formatter.showToast(
                `✅ Valid JSON! Structure: ${stats.depth} levels deep, ${stats.keys} keys, ${stats.objects} objects, ${stats.arrays} arrays`,
                'success',
                4000
            );
        } else {
            // Clear output for invalid JSON
            this.formatter.elements.outputText.value = '';
            this.formatter.highlighter.clearHighlighting();
            this.formatter.updateOutputStats('');
        }
    }

    /**
     * Handle sort keys button click
     */
    onSortKeysClick() {
        this.formatter.toggleSortKeys();
    }

    /**
     * Handle indentation option change
     */
    onIndentationChange(option) {
        const value = option.value;
        this.formatter.currentIndentation = value === 'tab' ? '\t' : parseInt(value);

        // Re-format if we have valid JSON
        if (this.formatter.validationResult.isValid && this.formatter.currentOperation === 'format') {
            this.formatter.formatJSON(true);
        }

        this.formatter.showToast(`Indentation set to ${value === 'tab' ? 'tabs' : value + ' spaces'}`, 'info', 2000);
    }

    /**
     * Handle advanced option changes
     */
    onAdvancedOptionChange(option) {
        switch (option.id) {
            case 'enableSyntaxHighlighting':
                this.formatter.enableSyntaxHighlighting = option.checked;
                this.formatter.highlighter.setEnabled(option.checked);
                this.formatter.showToast(
                    `Syntax highlighting ${option.checked ? 'enabled' : 'disabled'}`,
                    'info',
                    2000
                );
                break;

            case 'autoValidate':
                this.formatter.autoValidate = option.checked;
                this.formatter.showToast(
                    `Auto-validation ${option.checked ? 'enabled' : 'disabled'}`,
                    'info',
                    2000
                );
                break;

            case 'compactArrays':
                // Future feature: compact array display
                break;

            case 'escapeUnicode':
                // Future feature: escape unicode characters
                break;
        }
    }

    /**
     * Handle input area keydown events
     */
    onInputKeydown(e) {
        // Allow normal typing - don't prevent default unnecessarily

        // Tab key for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertAtCursor(e.target, '  '); // 2 spaces
            this.debouncedUpdate();
            return;
        }

        // Auto-bracket completion
        if (this.shouldAutoComplete(e.key)) {
            this.handleAutoCompletion(e);
        }
    }

    /**
     * Handle output area keydown events
     */
    onOutputKeydown(e) {
        // Ctrl+A for select all
        if (e.ctrlKey && e.key === 'a') {
            e.target.select();
            e.preventDefault();
            return;
        }

        // Prevent editing in output (readonly behavior)
        if (!e.ctrlKey && !e.metaKey && e.key.length === 1) {
            e.preventDefault();
        }
    }

    /**
     * Handle JSONPath input keydown
     */
    onJsonPathKeydown(e) {
        // Enter key to execute query
        if (e.key === 'Enter') {
            this.formatter.pathHandler.executeJsonPath();
        }

        // Escape key to clear
        if (e.key === 'Escape') {
            e.target.value = '';
            this.formatter.pathHandler.clearResult();
        }
    }

    /**
     * Check if auto-completion should be triggered
     */
    shouldAutoComplete(key) {
        const autoCompleteChars = ['{', '[', '"'];
        return autoCompleteChars.includes(key);
    }

    /**
     * Handle auto-completion of brackets and quotes
     */
    handleAutoCompletion(e) {
        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        let completionChar = '';

        switch (e.key) {
            case '{':
                completionChar = '}';
                break;
            case '[':
                completionChar = ']';
                break;
            case '"':
                completionChar = '"';
                break;
        }

        if (completionChar) {
            e.preventDefault();

            const selectedText = textarea.value.substring(start, end);
            const replacement = e.key + selectedText + completionChar;

            this.replaceSelection(textarea, replacement);

            // Position cursor between the brackets/quotes
            textarea.setSelectionRange(start + 1, start + 1 + selectedText.length);
        }
    }

    /**
     * Insert text at cursor position
     */
    insertAtCursor(textarea, text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + text + value.substring(end);
        textarea.setSelectionRange(start + text.length, start + text.length);
    }

    /**
     * Replace selected text
     */
    replaceSelection(textarea, replacement) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        textarea.value = value.substring(0, start) + replacement + value.substring(end);
    }

    /**
     * Update operation button states
     */
    updateOperationButtonStates(activeOperation) {
        const { elements } = this.formatter;

        // Reset all buttons
        [elements.formatBtn, elements.minifyBtn].forEach(btn => {
            if (btn) {
                btn.classList.remove('primary');
            }
        });

        // Highlight active operation
        const activeBtn = activeOperation === 'format' ? elements.formatBtn : elements.minifyBtn;
        if (activeBtn) {
            activeBtn.classList.add('primary');
        }
    }

    /**
     * Toggle advanced section
     */
    toggleAdvancedSection() {
        const { elements } = this.formatter;

        if (elements.advancedSection) {
            const isExpanded = elements.advancedSection.classList.contains('expanded');

            if (isExpanded) {
                elements.advancedSection.classList.remove('expanded');
            } else {
                elements.advancedSection.classList.add('expanded');
            }

            // Update toggle button
            if (elements.advancedToggle) {
                const icon = elements.advancedToggle.querySelector('i');
                if (icon) {
                    icon.className = isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                }
            }
        }
    }

    /**
     * Focus input textarea
     */
    focusInput() {
        const { elements } = this.formatter;
        if (elements.inputText) {
            elements.inputText.focus();

            // Move cursor to end
            const length = elements.inputText.value.length;
            elements.inputText.setSelectionRange(length, length);
        }
    }

    /**
     * Handle file drag and drop
     */
    setupFileDragDrop() {
        const { elements } = this.formatter;

        // Setup drag and drop on input textarea
        if (elements.inputText) {
            elements.inputText.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.target.classList.add('drag-over');
            });

            elements.inputText.addEventListener('dragleave', (e) => {
                e.target.classList.remove('drag-over');
            });

            elements.inputText.addEventListener('drop', (e) => {
                e.preventDefault();
                e.target.classList.remove('drag-over');
                this.handleFileDrop(e);
            });
        }
    }

    /**
     * Handle dropped files
     */
    async handleFileDrop(e) {
        const files = e.dataTransfer.files;

        if (files.length === 0) return;

        const file = files[0];

        // Check file type
        if (!file.type.includes('json') && !file.name.endsWith('.json')) {
            this.formatter.showToast('Please drop a JSON file', 'warning');
            return;
        }

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.formatter.showToast('File too large. Maximum size is 5MB.', 'error');
            return;
        }

        try {
            const text = await this.readFileAsText(file);
            this.formatter.elements.inputText.value = text;
            this.formatter.updateOutput();
            this.formatter.showToast(`File "${file.name}" loaded successfully`, 'success');
        } catch (error) {
            this.formatter.handleError(error, `Failed to read file: ${file.name}`);
        }
    }

    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        // Event listeners will be cleaned up automatically when elements are removed
        this.formatter = null;
        this.debouncedUpdate = null;
        this.debouncedValidate = null;
        this.debouncedJsonPath = null;
    }
};