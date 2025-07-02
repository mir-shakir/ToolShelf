/**
 * ToolShelf Hash Generator - Main Class
 * Extends BaseTool with hash generation functionality
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.HashGenerator = class HashGenerator extends window.ToolShelf.BaseTool {
    constructor() {
        super('hash-generator');

        // Current state
        this.currentInputType = 'text';
        this.currentAlgorithm = 'sha256';
        this.currentFormat = 'hex';
        this.currentHash = null;
        this.batchResults = [];

        // DOM elements
        this.elements = {};

        // Component references
        this.operations = null;
        this.fileProcessor = null;
        this.uiHandlers = null;

        // Statistics
        this.stats = {
            hashesGenerated: 0,
            batchProcessingCount: 0,
            filesProcessed: 0,
            hmacGenerations: 0,
            comparisonsPerformed: 0
        };

        this.init();
    }

    /**
     * Initialize the Hash Generator
     */
    init() {
        console.log('🔐 Initializing Hash Generator...');

        try {
            this.initializeElements();
            this.initializeComponents();
            this.setupInitialState();

            super.init();
            console.log('✅ Hash Generator initialized successfully');
        } catch (error) {
            this.handleError(error, 'Failed to initialize Hash Generator');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Main action elements
        const elementIds = [
            'inputText', 'hashResult', 'currentAlgorithm', 'algorithmInfo',
            'hashLength', 'securityLevel', 'useCase', 'inputCharCount',
            'inputBytes', 'generateHash', 'copyHash', 'downloadHash',
            'resetAll', 'showAdvanced', 'hideAdvanced'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        // Validate required elements
        if (!this.elements.hashResult) {
            throw new Error('Required DOM elements not found');
        }

        console.log('🎯 Hash Generator DOM elements initialized');
    }

    /**
     * Initialize component modules
     */
    initializeComponents() {
        // Initialize hash operations
        this.operations = new window.ToolShelf.HashOperations(this);

        // Initialize file processor
        this.fileProcessor = new window.ToolShelf.HashFileProcessor(this);
        this.fileProcessor.init();

        // Initialize UI handlers
        this.uiHandlers = new window.ToolShelf.HashUIHandlers(this);
        this.uiHandlers.init();

        console.log('🔧 Hash Generator components initialized');
    }

    /**
     * Setup initial state
     */
    setupInitialState() {
        // Set initial algorithm info
        this.uiHandlers.updateAlgorithmInfo(this.currentAlgorithm);

        // Initialize Help Modal
        if (window.ToolShelf.HelpModal) {
            window.ToolShelf.HelpModal.init();
        }

        console.log('🎛️ Hash Generator initial state configured');
    }

    /**
     * Generate hash (public API)
     */
    async generateHash(input, algorithm = null, options = {}) {
        try {
            const algo = algorithm || this.currentAlgorithm;
            const hashOptions = { ...this.getHashOptions(), ...options };

            const hash = await this.operations.generateTextHash(input, algo, hashOptions);

            this.currentHash = hash;
            this.stats.hashesGenerated++;

            // Track analytics
            if (window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackToolUsage('hash_generator', 'generate', {
                    algorithm: algo,
                    inputType: this.currentInputType,
                    hasHMAC: hashOptions.hmac || false
                });
            }

            return hash;
        } catch (error) {
            this.handleError(error, 'Failed to generate hash');
            return null;
        }
    }

    /**
     * Get current hash options
     */
    getHashOptions() {
        const options = {
            format: this.currentFormat
        };

        // Check if HMAC is enabled
        const enableHMAC = document.getElementById('enableHMAC');
        if (enableHMAC && enableHMAC.checked) {
            const hmacKey = document.getElementById('hmacKey');
            const keyEncoding = document.getElementById('keyEncoding');

            if (hmacKey && hmacKey.value.trim()) {
                options.hmac = true;
                options.hmacKey = hmacKey.value.trim();
                options.keyEncoding = keyEncoding ? keyEncoding.value : 'utf8';
            }
        }

        return options;
    }

    /**
     * Display hash result
     */
    displayHash(hash, algorithm) {
        this.currentHash = hash;
        this.uiHandlers.formatAndDisplayHash(hash, this.currentFormat);

        // Update algorithm info if different
        if (algorithm !== this.currentAlgorithm) {
            this.currentAlgorithm = algorithm;
            this.uiHandlers.updateAlgorithmInfo(algorithm);
        }

        console.log(`🔐 Hash displayed: ${algorithm}`);
    }

    /**
     * Clear current hash
     */
    clearHash() {
        this.currentHash = null;
        this.uiHandlers.clearHashDisplay();
    }

    /**
     * Switch input type (public API)
     */
    switchInputType(type) {
        const validTypes = ['text', 'file', 'batch'];

        if (!validTypes.includes(type)) {
            throw new Error(`Invalid input type: ${type}`);
        }

        this.uiHandlers.switchInputType(type);
    }

    /**
     * Switch algorithm (public API)
     */
    switchAlgorithm(algorithm) {
        const supportedAlgorithms = this.operations.getSupportedAlgorithms();

        if (!supportedAlgorithms.includes(algorithm)) {
            throw new Error(`Unsupported algorithm: ${algorithm}`);
        }

        this.uiHandlers.switchAlgorithm(algorithm);
    }

    /**
     * Set hash data programmatically (public API)
     */
    setHashData(input, inputType = 'text') {
        try {
            this.switchInputType(inputType);

            if (inputType === 'text') {
                const textInput = this.elements.inputText;
                if (textInput) {
                    textInput.value = input;
                    this.uiHandlers.updateHash();
                }
            }

            console.log(`📝 Hash data set: ${inputType}`);
        } catch (error) {
            this.handleError(error, 'Failed to set hash data');
        }
    }

    /**
     * Compare hashes (public API)
     */
    compareHashes(hash1, hash2) {
        try {
            this.stats.comparisonsPerformed++;
            return this.operations.compareHashes(hash1, hash2);
        } catch (error) {
            this.handleError(error, 'Failed to compare hashes');
            return { match: false, reason: 'Comparison failed' };
        }
    }

    /**
     * Generate HMAC (public API)
     */
    async generateHMAC(input, key, algorithm = null, keyEncoding = 'utf8') {
        try {
            const algo = algorithm || this.currentAlgorithm;
            const options = {
                hmac: true,
                hmacKey: key,
                keyEncoding: keyEncoding,
                format: this.currentFormat
            };

            const hmac = await this.operations.generateTextHash(input, algo, options);
            this.stats.hmacGenerations++;

            return hmac;
        } catch (error) {
            this.handleError(error, 'Failed to generate HMAC');
            return null;
        }
    }

    /**
     * Process file for hashing (public API)
     */
    async processFile(file) {
        try {
            this.stats.filesProcessed++;
            await this.fileProcessor.handleFileSelect([file]);
            return true;
        } catch (error) {
            this.handleError(error, 'Failed to process file');
            return false;
        }
    }

    /**
     * Get supported algorithms (public API)
     */
    getSupportedAlgorithms() {
        return this.operations.getSupportedAlgorithms();
    }

    /**
     * Get algorithm information (public API)
     */
    getAlgorithmInfo(algorithm) {
        return this.operations.getAlgorithmInfo(algorithm);
    }

    /**
     * Export configuration (public API)
     */
    exportConfig() {
        try {
            const config = {
                inputType: this.currentInputType,
                algorithm: this.currentAlgorithm,
                format: this.currentFormat,
                timestamp: new Date().toISOString()
            };

            // Add advanced settings if enabled
            const enableHMAC = document.getElementById('enableHMAC');
            if (enableHMAC && enableHMAC.checked) {
                config.hmacEnabled = true;
                const keyEncoding = document.getElementById('keyEncoding');
                if (keyEncoding) config.keyEncoding = keyEncoding.value;
            }

            const enableComparison = document.getElementById('enableComparison');
            if (enableComparison && enableComparison.checked) {
                config.comparisonEnabled = true;
            }

            return config;
        } catch (error) {
            this.handleError(error, 'Failed to export configuration');
            return null;
        }
    }

    /**
     * Import configuration (public API)
     */
    importConfig(config) {
        try {
            if (!config || typeof config !== 'object') {
                throw new Error('Invalid configuration object');
            }

            // Import basic settings
            if (config.inputType) {
                this.switchInputType(config.inputType);
            }

            if (config.algorithm) {
                this.switchAlgorithm(config.algorithm);
            }

            if (config.format) {
                this.uiHandlers.switchOutputFormat(config.format);
            }

            // Import advanced settings
            if (config.hmacEnabled) {
                const enableHMAC = document.getElementById('enableHMAC');
                if (enableHMAC) {
                    enableHMAC.checked = true;
                    this.uiHandlers.toggleHMAC(true);
                }

                if (config.keyEncoding) {
                    const keyEncoding = document.getElementById('keyEncoding');
                    if (keyEncoding) keyEncoding.value = config.keyEncoding;
                }
            }

            if (config.comparisonEnabled) {
                const enableComparison = document.getElementById('enableComparison');
                if (enableComparison) {
                    enableComparison.checked = true;
                    this.uiHandlers.toggleComparison(true);
                }
            }

            this.showToast('Configuration imported successfully', 'success');
            return true;

        } catch (error) {
            this.handleError(error, 'Failed to import configuration');
            return false;
        }
    }

    /**
     * Get current hash data (public API)
     */
    getCurrentHashData() {
        try {
            return {
                inputType: this.currentInputType,
                algorithm: this.currentAlgorithm,
                format: this.currentFormat,
                hash: this.currentHash,
                options: this.getHashOptions(),
                batchResults: this.batchResults,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.handleError(error, 'Failed to get current hash data');
            return null;
        }
    }

    /**
     * Get hash generator statistics (public API)
     */
    getStats() {
        const baseStats = this.getPerformanceStats();

        return {
            ...baseStats,
            ...this.stats,
            currentInputType: this.currentInputType,
            currentAlgorithm: this.currentAlgorithm,
            currentFormat: this.currentFormat,
            hasCurrentHash: !!this.currentHash,
            supportedAlgorithms: this.operations.getSupportedAlgorithms().length,
            batchResultsCount: this.batchResults.length
        };
    }

    /**
     * Tool becomes visible
     */
    onShow() {
        super.onShow();

        // Focus appropriate input based on current type
        if (this.currentInputType === 'text') {
            const textInput = this.elements.inputText;
            if (textInput) textInput.focus();
        }
    }

    /**
     * Tool becomes hidden
     */
    onHide() {
        super.onHide();

        // Save current state
        const state = this.exportState();
        window.ToolShelf.Utils.storage.set('hash_generator_state', state);
    }

    /**
     * Export tool state
     */
    exportState() {
        const baseState = super.exportState();

        return {
            ...baseState,
            currentInputType: this.currentInputType,
            currentAlgorithm: this.currentAlgorithm,
            currentFormat: this.currentFormat,
            currentHash: this.currentHash,
            stats: { ...this.stats },
            config: this.exportConfig()
        };
    }

    /**
     * Import tool state
     */
    importState(state) {
        try {
            super.importState(state);

            if (state.currentInputType) {
                this.currentInputType = state.currentInputType;
            }

            if (state.currentAlgorithm) {
                this.currentAlgorithm = state.currentAlgorithm;
            }

            if (state.currentFormat) {
                this.currentFormat = state.currentFormat;
            }

            if (state.stats) {
                this.stats = { ...this.stats, ...state.stats };
            }

            if (state.config) {
                this.importConfig(state.config);
            }

            console.log('📥 Hash Generator state imported successfully');

        } catch (error) {
            this.handleError(error, 'Failed to import state');
        }
    }

    /**
     * Handle errors with hash-specific context
     */
    handleError(error, userMessage = 'Hash Generator error occurred', context = {}) {
        const hashContext = {
            ...context,
            currentInputType: this.currentInputType,
            currentAlgorithm: this.currentAlgorithm,
            currentFormat: this.currentFormat,
            hasCurrentHash: !!this.currentHash,
            hashStats: this.operations?.getHashStatistics?.() || {}
        };

        return super.handleError(error, userMessage, hashContext);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        try {
            // Save final state
            const state = this.exportState();
            window.ToolShelf.Utils.storage.set('hash_generator_state', state);

            // Clean up components
            if (this.operations) {
                this.operations = null;
            }

            if (this.fileProcessor) {
                this.fileProcessor.destroy();
                this.fileProcessor = null;
            }

            if (this.uiHandlers) {
                this.uiHandlers.destroy();
                this.uiHandlers = null;
            }

            // Clear references
            this.elements = {};
            this.currentHash = null;
            this.batchResults = [];

            super.destroy();
            console.log('🗑️ Hash Generator destroyed successfully');

        } catch (error) {
            console.error('Error during Hash Generator cleanup:', error);
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for required crypto support
    if (!window.crypto) {
        console.warn('⚠️ Web Crypto API not available. Some features may be limited.');
    }

    console.log('✅ Hash Generator dependencies loaded successfully');
});