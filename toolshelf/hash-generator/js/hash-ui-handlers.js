/**
 * ToolShelf Hash UI Handlers - Fixed with Auto-Generation
 * Manages all UI interactions with improved UX
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.HashUIHandlers = class HashUIHandlers {
    constructor(generator) {
        this.generator = generator;
        this.debouncedUpdate = null;
        this.lastHashGenerated = null;
    }

    /**
     * Initialize UI handlers
     */
    init() {
        this.setupControlHandlers();
        this.setupInputHandlers();
        this.setupAdvancedFeatures();
        this.setupActionButtons();
        // this.setupKeyboardShortcuts();

        // Create debounced update function for input stats only
        this.debouncedUpdate = window.ToolShelf.Utils.debounce(() => {
            this.updateInputStats();
        }, 300);

        console.log('🎨 Hash UI Handlers initialized');
    }

    /**
 * Setup control handlers (updated with auto-generation)
 */
    setupControlHandlers() {
        // Input type selector
        const inputTypeSelect = document.getElementById('inputTypeSelect');
        if (inputTypeSelect) {
            this.generator.addEventListener(inputTypeSelect, 'change', (e) => {
                this.switchInputType(e.target.value);
            });
        }

        // Algorithm selector - AUTO GENERATE
        const algorithmSelect = document.getElementById('algorithmSelect');
        if (algorithmSelect) {
            this.generator.addEventListener(algorithmSelect, 'change', (e) => {
                this.switchAlgorithm(e.target.value);
                this.autoGenerateIfHasInput();
            });
        }

        // Format selector - AUTO GENERATE
        const formatSelect = document.getElementById('formatSelect');
        if (formatSelect) {
            this.generator.addEventListener(formatSelect, 'change', (e) => {
                this.switchOutputFormat(e.target.value);
                this.autoGenerateIfHasInput();
            });
        }

        // Generate button
        const generateBtn = document.getElementById('generateHashBtn');
        if (generateBtn) {
            this.generator.addEventListener(generateBtn, 'click', () => {
                this.generateHash();
            });
        }
    }

    /**
 * Auto-generate hash if input exists
 */
    autoGenerateIfHasInput() {
        const textInput = document.getElementById('inputText');
        const hasFile = this.generator.fileProcessor?.getCurrentFile();

        if ((textInput && textInput.value.trim()) || hasFile) {
            this.generateHash();
            this.showAutoGenerationIndicator();
        }
    }

    /**
 * Show visual indicator that hash was auto-generated
 */
    showAutoGenerationIndicator() {
        const outputHeader = document.querySelector('.hash-output-panel .output-header h3');
        if (outputHeader) {
            // Add "updated" indicator
            outputHeader.innerHTML = outputHeader.textContent + ' <span class="hash-updated">✓ Updated</span>';

            // Remove indicator after 3 seconds
            setTimeout(() => {
                const indicator = outputHeader.querySelector('.hash-updated');
                if (indicator) indicator.remove();
            }, 3000);
        }
    }

    /**
     * Auto-generate hash when options change (but not input)
     */
    async autoGenerateHash(reason) {
        if (this.generator.currentInputType === 'text') {
            const textInput = document.getElementById('inputText');
            if (textInput && textInput.value.trim()) {
                try {
                    this.showHashStatusIndicator('processing', `Updating hash due to ${reason}...`);
                    await this.generateTextHash();
                    this.showHashStatusIndicator('updated', `Hash updated for ${reason}`);

                    // Hide indicator after 3 seconds
                    setTimeout(() => {
                        this.hideHashStatusIndicator();
                    }, 3000);
                } catch (error) {
                    this.hideHashStatusIndicator();
                    console.warn('Auto-generation failed:', error);
                }
            }
        } else if (this.generator.currentInputType === 'file') {
            if (this.generator.fileProcessor.getCurrentFile()) {
                try {
                    this.showHashStatusIndicator('processing', `Updating hash due to ${reason}...`);
                    await this.generator.fileProcessor.processFile();
                    this.showHashStatusIndicator('updated', `Hash updated for ${reason}`);

                    setTimeout(() => {
                        this.hideHashStatusIndicator();
                    }, 3000);
                } catch (error) {
                    this.hideHashStatusIndicator();
                    console.warn('Auto-generation failed:', error);
                }
            }
        }
    }

    /**
     * Show/hide hash status indicator
     */
    showHashStatusIndicator(type, message) {
        let indicator = document.querySelector('.hash-status-indicator');
        if (!indicator) {
            // Create indicator if it doesn't exist
            indicator = document.createElement('div');
            indicator.className = 'hash-status-indicator';

            const controlsSection = document.querySelector('.hash-controls-section');
            if (controlsSection) {
                controlsSection.appendChild(indicator);
            }
        }

        indicator.className = `hash-status-indicator ${type} show`;
        indicator.innerHTML = `
            <i class="fas ${type === 'processing' ? 'fa-spinner fa-spin' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        `;
    }

    hideHashStatusIndicator() {
        const indicator = document.querySelector('.hash-status-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }

    /**
    * Switch input type (updated for better file handling)
    */
    switchInputType(inputType) {
        // Update generator state
        this.generator.currentInputType = inputType;

        // Show/hide input panels
        document.querySelectorAll('.input-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${inputType}-input-panel`);
        });

        // Update panel header
        this.updatePanelHeader(inputType);

        // Update stats display
        this.updateStatsDisplay(inputType);

        // Clear current hash when switching types
        this.generator.clearHash();

        console.log(`📝 Switched to ${inputType} input mode`);
    }

    /**
 * Update stats display based on input type
 */
    updateStatsDisplay(inputType) {
        const charCountDisplay = document.getElementById('inputCharCount')?.parentElement;
        const byteCountDisplay = document.getElementById('inputBytes')?.parentElement;
        const fileStatsDisplay = document.querySelector('.file-stats-display');

        if (inputType === 'file') {
            if (charCountDisplay) charCountDisplay.style.display = 'none';
            if (byteCountDisplay) byteCountDisplay.style.display = 'none';
            if (fileStatsDisplay) fileStatsDisplay.style.display = 'flex';
        } else {
            if (charCountDisplay) charCountDisplay.style.display = 'flex';
            if (byteCountDisplay) byteCountDisplay.style.display = 'flex';
            if (fileStatsDisplay) fileStatsDisplay.style.display = 'none';
        }
    }

    /**
     * Update panel header based on input type
     */
    updatePanelHeader(inputType) {
        const panelTitle = document.querySelector('.hash-input-panel .panel-header h3');
        if (!panelTitle) return;

        const icons = {
            text: 'fas fa-edit',
            file: 'fas fa-file-upload'
        };

        const titles = {
            text: 'Text Input',
            file: 'File Upload'
        };

        panelTitle.innerHTML = `<i class="${icons[inputType]}"></i> ${titles[inputType]}`;
    }

    /**
     * Switch hash algorithm
     */
    switchAlgorithm(algorithm) {
        // Update generator state
        this.generator.currentAlgorithm = algorithm;

        // Update algorithm info display
        this.updateAlgorithmInfo(algorithm);

        console.log(`🔐 Switched to ${algorithm} algorithm`);
    }

    switchAlgorithm(algorithm) {
        document.querySelectorAll('.algorithm-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.algorithm === algorithm);
            tab.classList.remove('disabled');
        });

        // Update generator state
        this.generator.currentAlgorithm = algorithm;

        // Update algorithm info display
        this.updateAlgorithmInfo(algorithm);

        // Regenerate hash with new algorithm
        this.updateHash();

        console.log(`🔐 Switched to ${algorithm} algorithm`);
    }

    async updateHash() {
        if (this.generator.currentInputType !== 'text') return;

        const textInput = document.getElementById('inputText');
        if (!textInput) return;

        const text = textInput.value.trim();

        // Update input stats
        this.updateInputStats(text);

        if (!text) {
            this.clearHashDisplay();
            return;
        }

        try {
            const algorithm = this.generator.currentAlgorithm;
            const options = this.generator.getHashOptions();

            const hash = await this.generator.operations.generateTextHash(text, algorithm, options);

            this.generator.currentHash = hash;
            this.formatAndDisplayHash(hash, this.generator.currentFormat);
            this.updateComparison();

        } catch (error) {
            console.warn('Hash update failed:', error);
            this.clearHashDisplay();
        }
    }

    /**
     * Switch output format
     */
    switchOutputFormat(format) {
        // Update generator state
        this.generator.currentFormat = format;

        // Reformat current hash if available
        if (this.generator.currentHash) {
            this.formatAndDisplayHash(this.generator.currentHash, format);
        }

        console.log(`📄 Switched to ${format} format`);
    }

    /**
     * Update algorithm information display
     */
    updateAlgorithmInfo(algorithm) {
        const algorithmInfo = this.generator.operations.getAlgorithmInfo(algorithm);
        if (!algorithmInfo) return;

        // Update output header
        const outputTitle = document.querySelector('.hash-output-panel .output-header h3');
        if (outputTitle) {
            outputTitle.textContent = `${algorithmInfo.name} Hash`;
        }

        // Update info grid
        const infoElements = {
            'info-algorithm': algorithmInfo.name,
            'info-length': `${algorithmInfo.outputLength} characters`,
            'info-security': this.getSecurityLevelText(algorithmInfo.security),
            'info-usecase': algorithmInfo.useCase
        };

        Object.entries(infoElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;

                // Add security level styling
                if (id === 'info-security') {
                    element.className = `info-value security-${algorithmInfo.security}`;
                }
            }
        });

        // Update algorithm tips
        const tipsElement = document.querySelector('.algorithm-tips');
        if (tipsElement && algorithmInfo.tips) {
            tipsElement.innerHTML = `<strong>Tips:</strong> ${algorithmInfo.tips}`;
        }
    }

    /**
     * Get security level display text
     */
    getSecurityLevelText(level) {
        const levels = {
            'high': 'High Security',
            'medium': 'Medium Security',
            'low': 'Low Security',
            'legacy': 'Legacy (Deprecated)'
        };
        return levels[level] || level;
    }

    /**
     * Setup input handlers
     */
    setupInputHandlers() {
        // Text input - only update stats on input change, not auto-generate
        const textInput = document.getElementById('inputText');
        if (textInput) {
            this.generator.addEventListener(textInput, 'input', this.debouncedUpdate);
            this.generator.addEventListener(textInput, 'paste', () => {
                setTimeout(this.debouncedUpdate, 100);
            });
        }

        // Action buttons
        const pasteBtn = document.getElementById('pasteBtn');
        const clearInputBtn = document.getElementById('clearInput');

        if (pasteBtn) {
            this.generator.addEventListener(pasteBtn, 'click', () => {
                this.pasteFromClipboard();
            });
        }

        if (clearInputBtn) {
            this.generator.addEventListener(clearInputBtn, 'click', () => {
                this.clearTextInput();
            });
        }
    }

    /**
     * Setup advanced features
     */
    setupAdvancedFeatures() {
        const showAdvancedBtn = document.getElementById('showAdvanced');
        const hideAdvancedBtn = document.getElementById('hideAdvanced');
        const enableHMACBtn = document.getElementById('enableHMAC');
        const enableComparisonBtn = document.getElementById('enableComparison');

        if (showAdvancedBtn) {
            this.generator.addEventListener(showAdvancedBtn, 'click', () => {
                this.showAdvancedSection();
            });
        }

        if (hideAdvancedBtn) {
            this.generator.addEventListener(hideAdvancedBtn, 'click', () => {
                this.hideAdvancedSection();
            });
        }

        if (enableHMACBtn) {
            this.generator.addEventListener(enableHMACBtn, 'change', (e) => {
                this.toggleHMAC(e.target.checked);
                // Auto-generate when HMAC is toggled
                if (e.target.checked) {
                    this.autoGenerateHash('HMAC enabled');
                } else {
                    this.autoGenerateHash('HMAC disabled');
                }
            });
        }

        if (enableComparisonBtn) {
            this.generator.addEventListener(enableComparisonBtn, 'change', (e) => {
                this.toggleComparison(e.target.checked);
            });
        }

        // Setup HMAC and comparison input handlers
        this.setupHMACHandlers();
        this.setupComparisonHandlers();
    }

    /**
     * Show advanced features section
     */
    showAdvancedSection() {
        const advancedSection = document.getElementById('advancedSection');
        const showBtn = document.getElementById('showAdvanced');

        if (advancedSection) advancedSection.style.display = 'block';
        if (showBtn) showBtn.style.display = 'none';

        this.generator.showToast('Advanced features enabled', 'info');
    }

    /**
     * Hide advanced features section
     */
    hideAdvancedSection() {
        const advancedSection = document.getElementById('advancedSection');
        const showBtn = document.getElementById('showAdvanced');

        if (advancedSection) advancedSection.style.display = 'none';
        if (showBtn) showBtn.style.display = 'inline-flex';
    }

    /**
     * Setup HMAC handlers
     */
    setupHMACHandlers() {
        const hmacKey = document.getElementById('hmacKey');
        const keyEncoding = document.getElementById('keyEncoding');

        if (hmacKey) {
            this.generator.addEventListener(hmacKey, 'input', () => {
                // Auto-generate when HMAC key changes
                this.autoGenerateHash('HMAC key change');
            });
        }

        if (keyEncoding) {
            this.generator.addEventListener(keyEncoding, 'change', () => {
                // Auto-generate when key encoding changes
                this.autoGenerateHash('HMAC encoding change');
            });
        }
    }

    /**
     * Toggle HMAC functionality
     */
    toggleHMAC(enabled) {
        const hmacOptions = document.getElementById('hmacOptions');

        if (hmacOptions) {
            hmacOptions.style.display = enabled ? 'block' : 'none';
        }
    }

    /**
     * Setup comparison handlers
     */
    setupComparisonHandlers() {
        const expectedHash = document.getElementById('expectedHash');

        if (expectedHash) {
            this.generator.addEventListener(expectedHash, 'input', () => {
                this.updateComparison();
            });
        }
    }

    /**
     * Toggle hash comparison functionality
     */
    toggleComparison(enabled) {
        const comparisonOptions = document.getElementById('comparisonOptions');

        if (comparisonOptions) {
            comparisonOptions.style.display = enabled ? 'block' : 'none';
        }

        if (enabled) {
            this.updateComparison();
        }
    }

    /**
     * Update hash comparison
     */
    updateComparison() {
        const expectedHash = document.getElementById('expectedHash');
        const comparisonStatus = document.getElementById('comparisonStatus');

        if (!expectedHash || !comparisonStatus || !this.generator.currentHash) return;

        const expected = expectedHash.value.trim();
        const actual = this.generator.currentHash;

        if (!expected) {
            comparisonStatus.className = 'comparison-status pending';
            comparisonStatus.innerHTML = '<i class="fas fa-question-circle"></i> <span>Enter hash to compare</span>';
            return;
        }

        const comparison = this.generator.operations.compareHashes(actual, expected);

        if (comparison.match) {
            comparisonStatus.className = 'comparison-status match';
            comparisonStatus.innerHTML = '<i class="fas fa-check-circle"></i> <span>Hashes match!</span>';
        } else {
            comparisonStatus.className = 'comparison-status no-match';
            comparisonStatus.innerHTML = '<i class="fas fa-times-circle"></i> <span>Hashes do not match</span>';
        }
    }

    /**
     * Setup action button handlers
     */
    setupActionButtons() {
        const copyBtn = document.getElementById('copyHash');
        const downloadBtn = document.getElementById('downloadHash');
        const resetBtn = document.getElementById('resetAll');

        if (copyBtn) {
            this.generator.addEventListener(copyBtn, 'click', () => {
                this.copyHash();
            });
        }

        if (downloadBtn) {
            this.generator.addEventListener(downloadBtn, 'click', () => {
                this.downloadHash();
            });
        }

        if (resetBtn) {
            this.generator.addEventListener(resetBtn, 'click', () => {
                this.resetAll();
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl+g', callback: () => this.generateHash(), description: 'Generate hash' },
            { key: 'Ctrl+c', callback: () => this.copyHash(), description: 'Copy hash' },
            { key: 'Ctrl+d', callback: () => this.downloadHash(), description: 'Download hash' },
            { key: 'Ctrl+r', callback: () => this.resetAll(), description: 'Reset all' },
            { key: 'Ctrl+l', callback: () => this.clearTextInput(), description: 'Clear input' },
            { key: 'Ctrl+v', callback: () => this.pasteFromClipboard(), description: 'Paste from clipboard' }
        ];

        this.generator.registerShortcuts(shortcuts);
    }
    async generateHash() {
        // Remove batch case entirely, only handle text and file
        try {
            switch (this.generator.currentInputType) {
                case 'text':
                    await this.generateTextHash();
                    break;
                case 'file':
                    if (this.generator.fileProcessor.getCurrentFile()) {
                        await this.generator.fileProcessor.processFile();
                    } else {
                        this.generator.showToast('Please select a file first', 'warning');
                    }
                    break;
            }
        } catch (error) {
            this.generator.handleError(error, 'Hash generation failed');
        }
    }

    /**
     * Generate hash for text input
     */
    async generateTextHash() {
        const textInput = document.getElementById('inputText');
        if (!textInput) return;

        const text = textInput.value.trim();
        if (!text) {
            this.generator.showToast('Please enter text to hash', 'warning');
            return;
        }

        try {
            const algorithm = this.generator.currentAlgorithm;
            const options = this.generator.getHashOptions();

            // Show loading state
            this.showLoadingState();

            const hash = await this.generator.operations.generateTextHash(text, algorithm, options);

            this.generator.currentHash = hash;
            this.formatAndDisplayHash(hash, this.generator.currentFormat);
            this.updateComparison();

            this.generator.showToast(`${algorithm.toUpperCase()} hash generated`, 'success');

        } catch (error) {
            this.generator.handleError(error, 'Text hash generation failed');
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Format and display hash
     */
    formatAndDisplayHash(hash, format) {
        const hashResult = document.getElementById('hashResult');
        if (!hashResult) return;

        hashResult.innerHTML = `<div class="hash-value">${hash}</div>`;
        hashResult.classList.add('has-content');

        // Update action button states
        this.updateActionButtonStates(true);
    }

    /**
     * Clear hash display
     */
    clearHashDisplay() {
        const hashResult = document.getElementById('hashResult');
        if (hashResult) {
            hashResult.innerHTML = `
                <div class="hash-placeholder">
                    <i class="fas fa-hashtag"></i>
                    <p>Hash will appear here</p>
                </div>
            `;
            hashResult.classList.remove('has-content');
        }

        this.generator.currentHash = null;
        this.updateActionButtonStates(false);
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const generateBtn = document.getElementById('generateHashBtn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const generateBtn = document.getElementById('generateHashBtn');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-play"></i> Generate Hash';
        }
    }

    /**
     * Update input statistics
     */
    updateInputStats() {
        const textInput = document.getElementById('inputText');
        const charCount = document.getElementById('inputCharCount');
        const byteCount = document.getElementById('inputBytes');

        if (!textInput || !charCount || !byteCount) return;

        const text = textInput.value;
        if (charCount) charCount.textContent = text.length.toLocaleString();
        if (byteCount) byteCount.textContent = new Blob([text]).size.toLocaleString();
    }

    /**
     * Update action button states
     */
    updateActionButtonStates(hasHash) {
        const buttons = ['copyHash', 'downloadHash'];

        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = !hasHash;
        });
    }

    /**
     * Paste from clipboard
     */
    async pasteFromClipboard() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                this.generator.showToast('Clipboard access not available', 'warning');
                return;
            }

            const text = await navigator.clipboard.readText();
            if (text) {
                const textInput = document.getElementById('inputText');
                if (textInput) {
                    textInput.value = text;
                    this.updateInputStats();
                    this.generator.showToast(`Pasted ${text.length.toLocaleString()} characters`, 'success');
                }
            } else {
                this.generator.showToast('Clipboard is empty', 'info');
            }
        } catch (error) {
            this.generator.showToast('Could not access clipboard', 'warning');
        }
    }

    /**
     * Clear text input
     */
    clearTextInput() {
        const textInput = document.getElementById('inputText');
        if (textInput) {
            textInput.value = '';
            textInput.focus();
            this.updateInputStats();
            this.clearHashDisplay();
            this.generator.showToast('Input cleared', 'success');
        }
    }

    /**
     * Copy current hash
     */
    async copyHash() {
        if (!this.generator.currentHash) {
            this.generator.showToast('No hash to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.generator.currentHash);
            this.generator.showToast('Hash copied to clipboard!', 'success');
        } catch (error) {
            this.generator.showToast('Failed to copy hash', 'error');
        }
    }

    /**
     * Download current hash
     */
    downloadHash() {
        if (!this.generator.currentHash) {
            this.generator.showToast('No hash to download', 'warning');
            return;
        }

        const algorithm = this.generator.currentAlgorithm;
        const timestamp = window.ToolShelf.Utils.getTimestamp();
        const filename = `toolshelf-${algorithm}-hash-${timestamp}.txt`;

        const content = `Hash: ${this.generator.currentHash}\nAlgorithm: ${algorithm.toUpperCase()}\nGenerated: ${new Date().toISOString()}`;

        const success = window.ToolShelf.Utils.downloadTextFile(content, filename);
        if (success) {
            this.generator.showToast(`Downloaded as ${filename}`, 'success');
        }
    }

    /**
     * Reset all settings and clear inputs
     */
    resetAll() {
        // Clear text input
        const textInput = document.getElementById('inputText');
        if (textInput) textInput.value = '';

        // Reset selectors to default
        const inputTypeSelect = document.getElementById('inputTypeSelect');
        const algorithmSelect = document.getElementById('algorithmSelect');
        const formatSelect = document.getElementById('formatSelect');

        if (inputTypeSelect) inputTypeSelect.value = 'text';
        if (algorithmSelect) algorithmSelect.value = 'sha256';
        if (formatSelect) formatSelect.value = 'hex';

        // Clear file
        if (this.generator.fileProcessor) {
            this.generator.fileProcessor.removeFile();
        }

        // Reset to defaults
        this.switchInputType('text');
        this.switchAlgorithm('sha256');
        this.switchOutputFormat('hex');

        // Hide advanced section
        this.hideAdvancedSection();

        // Reset advanced options
        const enableHMAC = document.getElementById('enableHMAC');
        const enableComparison = document.getElementById('enableComparison');

        if (enableHMAC) {
            enableHMAC.checked = false;
            this.toggleHMAC(false);
        }

        if (enableComparison) {
            enableComparison.checked = false;
            this.toggleComparison(false);
        }

        // Clear hash display
        this.clearHashDisplay();

        // Update stats
        this.updateInputStats();

        this.generator.showToast('All settings reset', 'success');
    }

    /**
     * Cleanup
     */
    destroy() {
        this.debouncedUpdate = null;
    }
};