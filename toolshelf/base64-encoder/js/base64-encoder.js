/**
 * ToolShelf Base64 Encoder/Decoder - Following ToolShelf Architecture
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.Base64Tool = class Base64Tool extends window.ToolShelf.BaseTool {
    constructor() {
        super('base64-encoder');

        // State management
        this.currentMode = 'encode'; // 'encode' or 'decode'
        this.autoDetectEnabled = true;
        this.format = 'standard'; // 'standard', 'urlsafe', 'no-padding'
        this.chunkSize = 76; // For line wrapping
        this.enableLineWrap = false;

        // DOM elements
        this.elements = {};

        // Statistics
        this.stats = {
            inputChars: 0,
            inputBytes: 0,
            outputChars: 0,
            outputBytes: 0,
            operationsCount: 0
        };

        // Supported file types for encoding
        this.supportedFileTypes = [
            'text/plain', 'application/json', 'text/csv', 'text/xml',
            'text/html', 'text/css', 'application/javascript'
        ];

        this.init();
    }

    /**
     * Initialize the Base64 tool
     */
    init() {
        console.log('🔧 Initializing Base64 Encoder...');

        try {
            this.initializeElements();
            this.initializeUI();
            this.setupFileHandling();
            this.registerKeyboardShortcuts();
            this.setupAutoDetection();
            this.updateOutput(); // Initial update

            super.init();
            console.log('✅ Base64 Encoder initialized successfully');
        } catch (error) {
            this.handleError(error, 'Failed to initialize Base64 Encoder');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        const elementIds = [
            'inputText', 'outputText', 'inputCharCount', 'inputBytes',
            'outputCharCount', 'outputBytes', 'operationStatus',
            'pasteBtn', 'clearInput', 'copyOutput', 'downloadOutput',
            'autoDetectMode', 'resetAll'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        // Format options
        this.elements.formatOptions = document.querySelectorAll('input[name="base64-format"]');
        this.elements.advancedOptions = document.querySelectorAll('.advanced-option input');

        // Operation buttons
        this.elements.encodeBtn = document.getElementById('encodeBtn');
        this.elements.decodeBtn = document.getElementById('decodeBtn');
        this.elements.swapBtn = document.getElementById('swapBtn');

        // Validate required elements
        if (!this.elements.inputText || !this.elements.outputText) {
            throw new Error('Required DOM elements not found');
        }

        if (window.ToolShelf.HelpModal) {
            window.ToolShelf.HelpModal.init();
        }

        console.log('🎯 Base64 DOM elements initialized');
    }

    /**
     * Initialize UI handlers
     */
    initializeUI() {
        // Input change handler with auto-detection
        const debouncedUpdate = window.ToolShelf.Utils.debounce(() => {
            this.updateOutput();
        }, 150);

        this.addEventListener(this.elements.inputText, 'input', debouncedUpdate);

        // Operation buttons
        this.addEventListener(this.elements.encodeBtn, 'click', () => this.performEncode());
        this.addEventListener(this.elements.decodeBtn, 'click', () => this.performDecode());
        this.addEventListener(this.elements.swapBtn, 'click', () => this.swapInputOutput());

        // Format options
        this.elements.formatOptions.forEach(option => {
            this.addEventListener(option, 'change', () => {
                this.format = option.value;
                this.updateOutput();
            });
        });

        // Advanced options
        this.elements.advancedOptions.forEach(option => {
            this.addEventListener(option, 'change', () => {
                this.handleAdvancedOptionChange(option);
            });
        });

        // Panel action buttons
        this.addEventListener(this.elements.pasteBtn, 'click', () => this.pasteFromClipboard());
        this.addEventListener(this.elements.clearInput, 'click', () => this.clearInput());
        this.addEventListener(this.elements.copyOutput, 'click', () => this.copyOutput());
        this.addEventListener(this.elements.downloadOutput, 'click', () => this.downloadOutput());

        // Auto-detect toggle
        if (this.elements.autoDetectMode) {
            this.addEventListener(this.elements.autoDetectMode, 'change', (e) => {
                this.autoDetectEnabled = e.target.checked;
                this.updateOutput();
            });
        }

        // Reset functionality
        if (this.elements.resetAll) {
            this.addEventListener(this.elements.resetAll, 'click', () => this.resetAll());
        }

        console.log('🎨 Base64 UI handlers initialized');
    }

    /**
     * Setup file drag and drop handling
     */
    setupFileHandling() {
        const fileHandler = document.querySelector('.file-handler');
        const fileInput = document.getElementById('fileInput');

        if (fileHandler && fileInput) {
            // Drag and drop events
            this.addEventListener(fileHandler, 'dragover', (e) => {
                e.preventDefault();
                fileHandler.classList.add('drag-over');
            });

            this.addEventListener(fileHandler, 'dragleave', () => {
                fileHandler.classList.remove('drag-over');
            });

            this.addEventListener(fileHandler, 'drop', (e) => {
                e.preventDefault();
                fileHandler.classList.remove('drag-over');
                this.handleFileUpload(e.dataTransfer.files);
            });

            // File input change
            this.addEventListener(fileInput, 'change', (e) => {
                this.handleFileUpload(e.target.files);
            });

            // Click to open file dialog
            this.addEventListener(fileHandler, 'click', () => {
                fileInput.click();
            });
        }
    }

    /**
     * Register keyboard shortcuts
     */
    registerKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl+e', callback: () => this.performEncode(), description: 'Encode to Base64' },
            { key: 'Ctrl+d', callback: () => this.performDecode(), description: 'Decode from Base64' },
            { key: 'Ctrl+s', callback: () => this.swapInputOutput(), description: 'Swap input/output' },
            { key: 'Ctrl+l', callback: () => this.clearInput(), description: 'Clear input' },
            { key: 'Ctrl+Enter', callback: () => this.copyOutput(), description: 'Copy output' },
            { key: 'Ctrl+r', callback: () => this.resetAll(), description: 'Reset all' }
        ];

        this.registerShortcuts(shortcuts);
        console.log('⌨️ Base64 keyboard shortcuts registered');
    }

    /**
     * Setup auto-detection
     */
    setupAutoDetection() {
        // Auto-detect is handled in updateOutput method
        console.log('🤖 Auto-detection enabled');
    }

    /**
     * Auto-detect input type (Base64 or plain text)
     */
    detectInputType(input) {
        if (!input.trim()) return 'text';

        // Base64 pattern check
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        const urlSafeBase64Pattern = /^[A-Za-z0-9_-]*$/;

        // Check if it looks like Base64
        const trimmed = input.trim().replace(/\s/g, '');

        if (base64Pattern.test(trimmed) && trimmed.length % 4 === 0) {
            return 'base64';
        }

        if (urlSafeBase64Pattern.test(trimmed) && trimmed.length % 4 === 0) {
            return 'urlsafe-base64';
        }

        return 'text';
    }

    /**
     * Update output with auto-detection
     */
    updateOutput() {
        return this.measurePerformance('updateOutput', () => {
            try {
                const input = this.elements.inputText.value;

                // Update input statistics
                this.updateInputStats(input);

                if (!input.trim()) {
                    this.elements.outputText.value = '';
                    this.updateOutputStats('');
                    this.updateStatus('Ready to encode/decode', 'info');
                    this.updateButtonStates();
                    return;
                }

                if (this.autoDetectEnabled) {
                    const detectedType = this.detectInputType(input);

                    if (detectedType === 'base64' || detectedType === 'urlsafe-base64') {
                        this.performDecode(true);
                    } else {
                        this.performEncode(true);
                    }
                } else {
                    // Manual mode - don't auto-process
                    this.updateStatus('Manual mode - click Encode or Decode', 'info');
                }

                this.updateButtonStates();

            } catch (error) {
                this.handleError(error, 'Error processing input');
            }
        });
    }

    /**
     * Perform encoding operation
     */
    performEncode(isAuto = false) {
        const input = this.elements.inputText.value;

        if (!input.trim()) {
            this.updateStatus('Please enter text to encode', 'error');
            return;
        }

        try {
            let encoded = this.encodeBase64(input);

            // Apply format options
            encoded = this.applyFormatOptions(encoded);

            this.elements.outputText.value = encoded;
            this.updateOutputStats(encoded);

            const statusMessage = isAuto ? 'Auto-encoded to Base64' : 'Text encoded to Base64';
            this.updateStatus(statusMessage, 'success');

            if (!isAuto) {
                this.showToast('Text encoded successfully!', 'success');
                // Track usage
                if (window.ToolShelf.Analytics) {
                    window.ToolShelf.Analytics.trackToolUsage('base64_encoder', 'encode');
                }
            }

        } catch (error) {
            this.handleError(error, 'Encoding failed');
            this.updateStatus('Encoding failed: Invalid input', 'error');
        }
    }

    /**
     * Perform decoding operation
     */
    performDecode(isAuto = false) {
        const input = this.elements.inputText.value.trim();

        if (!input) {
            this.updateStatus('Please enter Base64 string to decode', 'error');
            return;
        }

        try {
            const decoded = this.decodeBase64(input);

            this.elements.outputText.value = decoded;
            this.updateOutputStats(decoded);

            const statusMessage = isAuto ? 'Auto-decoded from Base64' : 'Base64 decoded to text';
            this.updateStatus(statusMessage, 'success');

            if (!isAuto) {
                this.showToast('Base64 decoded successfully!', 'success');
                // Track usage
                if (window.ToolShelf.Analytics) {
                    window.ToolShelf.Analytics.trackToolUsage('base64_encoder', 'decode');
                }
            }

        } catch (error) {
            this.handleError(error, 'Decoding failed');
            this.updateStatus('Decoding failed: Invalid Base64 string', 'error');
        }
    }

    /**
     * Base64 encoding with Unicode support
     */
    encodeBase64(text) {
        // Handle Unicode characters properly
        return btoa(unescape(encodeURIComponent(text)));
    }

    /**
     * Base64 decoding with format detection
     */
    decodeBase64(base64String) {
        let cleanBase64 = base64String.replace(/\s/g, '');

        // Handle URL-safe Base64
        if (this.format === 'urlsafe' || cleanBase64.includes('-') || cleanBase64.includes('_')) {
            cleanBase64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');
        }

        // Add padding if needed
        while (cleanBase64.length % 4) {
            cleanBase64 += '=';
        }

        // Decode with Unicode support
        return decodeURIComponent(escape(atob(cleanBase64)));
    }

    /**
     * Apply format options to Base64 output
     */
    applyFormatOptions(base64String) {
        let result = base64String;

        switch (this.format) {
            case 'urlsafe':
                result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
                break;
            case 'no-padding':
                result = result.replace(/=/g, '');
                break;
            // 'standard' format needs no modification
        }

        // Apply line wrapping if enabled
        if (this.enableLineWrap && this.chunkSize > 0) {
            result = result.match(new RegExp(`.{1,${this.chunkSize}}`, 'g')).join('\n');
        }

        return result;
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(files) {
        if (files.length === 0) return;

        const file = files[0];

        // Check file size (limit to 1MB for text files)
        if (file.size > 1024 * 1024) {
            this.showToast('File too large. Maximum size is 1MB.', 'error');
            return;
        }

        try {
            const text = await this.readFileAsText(file);
            this.elements.inputText.value = text;
            this.updateOutput();
            this.showToast(`File "${file.name}" loaded successfully`, 'success');

        } catch (error) {
            this.handleError(error, `Failed to read file: ${file.name}`);
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
     * Handle advanced option changes
     */
    handleAdvancedOptionChange(option) {
        switch (option.id) {
            case 'enableLineWrap':
                this.enableLineWrap = option.checked;
                break;
            case 'chunkSize':
                this.chunkSize = parseInt(option.value) || 76;
                break;
        }

        // Re-process if there's output
        if (this.elements.outputText.value) {
            this.updateOutput();
        }
    }

    /**
     * Swap input and output
     */
    swapInputOutput() {
        const temp = this.elements.inputText.value;
        this.elements.inputText.value = this.elements.outputText.value;
        this.elements.outputText.value = temp;

        this.updateOutput();
        this.showToast('Input and output swapped', 'success');
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
     * Update status message
     */
    updateStatus(message, type = 'info') {
        if (this.elements.operationStatus) {
            this.elements.operationStatus.textContent = message;
            this.elements.operationStatus.className = `operation-status ${type}`;
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
     * Clear input
     */
    clearInput() {
        this.elements.inputText.value = '';
        this.elements.outputText.value = '';
        this.updateInputStats('');
        this.updateOutputStats('');
        this.updateStatus('Ready to encode/decode', 'info');
        this.updateButtonStates();
        this.showToast('Input cleared', 'success');
    }

    /**
     * Paste from clipboard
     */
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                this.elements.inputText.value = text;
                this.updateOutput();
                this.showToast(`Pasted ${text.length} characters from clipboard`, 'success');
            } else {
                this.showToast('Clipboard is empty', 'info');
            }
        } catch (error) {
            this.handleError(error, 'Could not paste from clipboard');
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
            const operation = this.currentMode === 'encode' ? 'encoded' : 'decoded';
            const filename = `toolshelf-base64-${operation}-${timestamp}.txt`;

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
        this.clearInput();

        // Reset format to standard
        this.format = 'standard';
        const standardOption = document.querySelector('input[name="base64-format"][value="standard"]');
        if (standardOption) {
            standardOption.checked = true;
        }

        // Reset advanced options
        this.enableLineWrap = false;
        this.chunkSize = 76;

        this.elements.advancedOptions.forEach(option => {
            if (option.type === 'checkbox') {
                option.checked = false;
            } else if (option.type === 'number') {
                option.value = option.defaultValue || '';
            }
        });

        this.showToast('All settings reset', 'success');
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
            format: this.format,
            autoDetectEnabled: this.autoDetectEnabled,
            enableLineWrap: this.enableLineWrap,
            chunkSize: this.chunkSize,
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

            if (state.format) {
                this.format = state.format;
                const formatOption = document.querySelector(`input[name="base64-format"][value="${state.format}"]`);
                if (formatOption) {
                    formatOption.checked = true;
                }
            }

            if (state.autoDetectEnabled !== undefined) {
                this.autoDetectEnabled = state.autoDetectEnabled;
            }

            if (state.stats) {
                this.stats = { ...this.stats, ...state.stats };
            }

            this.updateOutput();
            console.log('📥 Base64 Encoder state imported successfully');

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
        // Save state
        const state = this.exportState();
        window.ToolShelf.Utils.storage.set('base64_encoder_state', state);
    }

    /**
     * Get tool statistics
     */
    getToolStats() {
        const baseStats = this.getPerformanceStats();

        return {
            ...baseStats,
            stats: { ...this.stats },
            format: this.format,
            autoDetectEnabled: this.autoDetectEnabled,
            inputLength: this.elements.inputText.value.length,
            outputLength: this.elements.outputText.value.length
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        // Save state before destroying
        const state = this.exportState();
        window.ToolShelf.Utils.storage.set('base64_encoder_state', state);

        this.unregisterShortcuts();
        this.elements = {};

        super.destroy();
        console.log('🗑️ Base64 Encoder destroyed');
    }
};