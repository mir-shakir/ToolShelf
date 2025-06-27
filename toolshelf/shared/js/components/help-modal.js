/**
 * ToolShelf Help Modal Component - Shared across all tools
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.HelpModal = {
    modal: null,
    helpBtn: null,
    helpClose: null,
    isInitialized: false,

    /**
     * Initialize help modal functionality
     */
    init() {
        if (this.isInitialized) return true;

        this.helpBtn = document.getElementById('helpBtn');
        this.modal = document.getElementById('helpModal');
        this.helpClose = document.getElementById('helpClose');

        if (!this.helpBtn || !this.modal || !this.helpClose) {
            console.warn('⚠️ Help modal elements not found');
            return false;
        }

        this.setupEventListeners();
        this.isInitialized = true;
        console.log('ℹ️ Help modal initialized');
        return true;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Help button click
        this.helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.show();
        });

        // Close button click
        this.helpClose.addEventListener('click', (e) => {
            e.preventDefault();
            this.hide();
        });

        // Backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    },

    /**
     * Show help modal
     */
    show() {
        if (!this.modal) return;

        this.modal.classList.add('show');
        this.modal.setAttribute('aria-hidden', 'false');

        // Focus management
        const firstFocusable = this.modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        console.log('ℹ️ Help modal shown');
    },

    /**
     * Hide help modal
     */
    hide() {
        if (!this.modal) return;

        this.modal.classList.remove('show');
        this.modal.setAttribute('aria-hidden', 'true');

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to help button
        if (this.helpBtn) {
            this.helpBtn.focus();
        }

        console.log('ℹ️ Help modal hidden');
    },

    /**
     * Check if modal is visible
     */
    isVisible() {
        return this.modal && this.modal.classList.contains('show');
    },

    /**
     * Toggle modal visibility
     */
    toggle() {
        if (this.isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    }
};