/**
 * ToolShelf Text Transformer UI Handlers - Updated with section reset and output stats
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.TextTransformerUI = {
    // DOM elements will be set by the main transformer class
    elements: {},

    /**
     * Initialize UI handlers
     */
    init(elements) {
        this.elements = elements;
        this.setupEventListeners();
        // this.setupHelpModal();
        console.log('🎨 Text Transformer UI handlers initialized');
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        const { elements } = this;

        // Input text changes
        if (elements.inputText) {
            const debouncedUpdate = window.ToolShelf.Utils.debounce(
                () => this.onInputChange(),
                window.ToolShelf.Constants.DEBOUNCE_DELAY
            );

            elements.inputText.addEventListener('input', debouncedUpdate);
            elements.inputText.addEventListener('paste', () => {
                setTimeout(() => this.onInputChange(), 10);
            });
        }

        // Transform controls
        if (elements.transformControls) {
            elements.transformControls.forEach(control => {
                control.addEventListener('change', (e) => {
                    this.onTransformChange(e.target);
                });
            });
        }

        // Action buttons
        this.setupActionButtons();

        // Section reset buttons
        this.setupSectionResetButtons();
    },

    /**
     * Set up action button event listeners
     */
    setupActionButtons() {
        const { elements } = this;
        const handlers = {
            clearInput: () => this.onClearAll(),
            clearInputOnly: () => this.onClearInput(),
            copyOutput: () => this.onCopyOutput(),
            copyOutputTop: () => this.onCopyOutput(),
            copyOutputSidebar: () => this.onCopyOutput(),
            pasteBtn: () => this.onPaste(),
            downloadBtn: () => this.onDownload(),
            downloadBtnSidebar: () => this.onDownload(),
            clearInputSidebar: () => this.onClearInput(),
            resetAll: () => this.onResetTransforms()
        };

        Object.entries(handlers).forEach(([id, handler]) => {
            const element = elements[id] || document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    },

    /**
     * Set up section reset buttons
     */
    setupSectionResetButtons() {
        const sectionResetButtons = document.querySelectorAll('.btn-section-reset');

        sectionResetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const section = e.target.closest('button').getAttribute('data-reset');
                this.onSectionReset(section);
            });
        });
    },

    /**
     * Set up help modal
     */
    // setupHelpModal() {
    //     const helpBtn = document.getElementById('helpBtn');
    //     const helpModal = document.getElementById('helpModal');
    //     const helpClose = document.getElementById('helpClose');

    //     if (helpBtn && helpModal && helpClose) {
    //         helpBtn.addEventListener('click', () => {
    //             helpModal.classList.add('show');
    //         });

    //         helpClose.addEventListener('click', () => {
    //             helpModal.classList.remove('show');
    //         });

    //         // Close on backdrop click
    //         helpModal.addEventListener('click', (e) => {
    //             if (e.target === helpModal) {
    //                 helpModal.classList.remove('show');
    //             }
    //         });

    //         // Close on escape key
    //         document.addEventListener('keydown', (e) => {
    //             if (e.key === 'Escape' && helpModal.classList.contains('show')) {
    //                 helpModal.classList.remove('show');
    //             }
    //         });
    //     }
    // },

    /**
     * Handle input text changes
     */
    onInputChange() {
        if (this.transformer) {
            this.transformer.updateOutput();
        }
    },

    /**
     * Handle transform control changes
     */
    onTransformChange(control) {
        if (this.transformer) {
            const transform = control.getAttribute('data-transform');
            this.transformer.handleTransformChange(control, transform);
        }
    },

    /**
     * Handle section reset
     */
    onSectionReset(section) {
        if (this.transformer) {
            this.transformer.resetSection(section);
        }
    },

    /**
     * Handle clear all action
     */
    onClearAll() {
        if (this.transformer) {
            this.transformer.clearAll();
        }
    },

    /**
     * Handle clear input action
     */
    onClearInput() {
        if (this.transformer) {
            this.transformer.clearInput();
        }
    },

    /**
     * Handle copy output action
     */
    async onCopyOutput() {
        if (this.transformer) {
            await this.transformer.copyOutput();
        }
    },

    /**
     * Handle paste action
     */
    async onPaste() {
        if (this.transformer) {
            await this.transformer.pasteFromClipboard();
        }
    },

    /**
     * Handle download action
     */
    async onDownload() {
        if (this.transformer) {
            await this.transformer.downloadOutput();
        }
    },

    /**
     * Handle reset transformations action
     */
    onResetTransforms() {
        if (this.transformer) {
            this.transformer.resetAllTransformations();
        }
    },

    /**
     * Update statistics display for both input and output
     */
    updateStats(inputStats, outputStats = null) {
        const { elements } = this;

        // Update input stats
        this.animateStatChange(elements.charCount, inputStats.chars);
        this.animateStatChange(elements.wordCount, inputStats.words);
        this.animateStatChange(elements.lineCount, inputStats.lines);

        // Update output stats if provided
        if (outputStats) {
            this.animateStatChange(document.getElementById('outputCharCount'), outputStats.chars);
            this.animateStatChange(document.getElementById('outputWordCount'), outputStats.words);
            this.animateStatChange(document.getElementById('outputLineCount'), outputStats.lines);
        }
    },

    /**
     * Animate stat changes
     */
    animateStatChange(element, newValue) {
        if (!element) return;

        const formattedValue = window.ToolShelf.Utils.formatNumber(newValue);

        if (element.textContent !== formattedValue) {
            element.style.transform = 'scale(1.1)';
            element.style.color = 'var(--primary-color)';
            element.textContent = formattedValue;

            setTimeout(() => {
                element.style.transform = '';
                element.style.color = '';
            }, 150);
        }
    },

    /**
     * Update transform status display
     */
    updateTransformStatus(transforms) {
        const { elements } = this;
        const statusElement = elements.transformStatus || document.getElementById('transformStatus');
        if (!statusElement) return;

        if (transforms.size === 0) {
            statusElement.textContent = 'No transformations applied';
            statusElement.classList.remove('active');
        } else {
            const displayNames = Array.from(transforms).map(t =>
                window.ToolShelf.Constants.TRANSFORM_DISPLAY_NAMES[t] || t
            );
            statusElement.textContent = `Active: ${displayNames.join(', ')}`;
            statusElement.classList.add('active');
        }
    },

    /**
     * Update change indicator
     */
    updateChangeIndicator(hasChanges) {
        const { elements } = this;
        const indicator = elements.changeIndicator || document.getElementById('changeIndicator');
        if (!indicator) return;

        if (hasChanges) {
            indicator.innerHTML = '<i class="fas fa-check"></i> Text transformed';
            indicator.classList.add('changed');
        } else {
            indicator.innerHTML = '<i class="fas fa-equals"></i> No changes';
            indicator.classList.remove('changed');
        }
    },

    /**
     * Update copy button states
     */
    updateCopyButtonStates(hasOutput) {
        const buttonIds = ['copyOutput', 'copyOutputTop', 'copyOutputSidebar', 'downloadBtn', 'downloadBtnSidebar'];

        buttonIds.forEach(id => {
            const btn = this.elements[id] || document.getElementById(id);
            if (btn) {
                btn.disabled = !hasOutput;
            }
        });
    },

    /**
     * Show visual feedback for transform selection
     */
    showTransformFeedback(transform, isActive) {
        const control = document.querySelector(`[data-transform="${transform}"]`);
        if (!control) return;

        const option = control.closest('.transform-option');
        if (option && isActive) {
            // Brief highlight animation
            option.style.transform = 'scale(1.02)';
            option.style.boxShadow = 'var(--shadow-md)';

            setTimeout(() => {
                option.style.transform = '';
                option.style.boxShadow = '';
            }, 200);
        }
    },

    /**
     * Focus input textarea
     */
    focusInput() {
        const { elements } = this;
        if (elements.inputText) {
            elements.inputText.focus();
            elements.inputText.setSelectionRange(
                elements.inputText.value.length,
                elements.inputText.value.length
            );
        }
    },

    /**
     * Set transformer reference
     */
    setTransformer(transformer) {
        this.transformer = transformer;
    }
};