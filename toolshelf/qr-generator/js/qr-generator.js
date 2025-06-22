/**
 * ToolShelf QR Code Generator - Main Class
 * Extends BaseTool with QR-specific functionality
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.QRGenerator = class QRGenerator extends window.ToolShelf.BaseTool {
    constructor() {
        super('qr-generator');

        // Current state
        this.currentType = 'url';
        this.currentFormat = 'png';
        this.currentLogo = null;

        // Components
        this.operations = null;
        this.bulkProcessor = null;
        this.uiHandlers = null;

        // DOM elements
        this.elements = {};

        // Statistics
        this.stats = {
            qrCodesGenerated: 0,
            bulkGenerations: 0,
            downloadsCount: 0,
            logoUploads: 0
        };

        this.init();
    }

    /**
     * Initialize the QR Generator
     */
    init() {
        console.log('🔧 Initializing QR Code Generator...');

        try {
            this.initializeElements();
            this.initializeComponents();
            this.setupInitialState();

            super.init();
            console.log('✅ QR Code Generator initialized successfully');
        } catch (error) {
            this.handleError(error, 'Failed to initialize QR Code Generator');
        }
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Main action buttons
        this.elements.downloadQR = document.getElementById('downloadQR');
        this.elements.resetQR = document.getElementById('resetQR');

        // QR type tabs are handled dynamically

        // URL form elements
        this.elements.urlInput = document.getElementById('urlInput');

        // WiFi form elements
        this.elements.wifiSSID = document.getElementById('wifiSSID');
        this.elements.wifiPassword = document.getElementById('wifiPassword');
        this.elements.wifiSecurity = document.getElementById('wifiSecurity');
        this.elements.wifiHidden = document.getElementById('wifiHidden');

        // Contact form elements
        this.elements.contactName = document.getElementById('contactName');
        this.elements.contactPhone = document.getElementById('contactPhone');
        this.elements.contactEmail = document.getElementById('contactEmail');
        this.elements.contactOrg = document.getElementById('contactOrg');

        // SMS form elements
        this.elements.smsNumber = document.getElementById('smsNumber');
        this.elements.smsMessage = document.getElementById('smsMessage');

        // Email form elements
        this.elements.emailTo = document.getElementById('emailTo');
        this.elements.emailSubject = document.getElementById('emailSubject');
        this.elements.emailBody = document.getElementById('emailBody');

        // Text form elements
        this.elements.textContent = document.getElementById('textContent');

        // Bulk form elements
        this.elements.bulkUploadArea = document.getElementById('bulkUploadArea');
        this.elements.csvFileInput = document.getElementById('csvFileInput');
        this.elements.bulkPreview = document.getElementById('bulkPreview');
        this.elements.bulkCount = document.getElementById('bulkCount');
        this.elements.generateBulk = document.getElementById('generateBulk');

        // Customization elements
        this.elements.foregroundColor = document.getElementById('foregroundColor');
        this.elements.backgroundColor = document.getElementById('backgroundColor');
        this.elements.qrSize = document.getElementById('qrSize');
        this.elements.qrMargin = document.getElementById('qrMargin');

        // Logo elements
        this.elements.logoInput = document.getElementById('logoInput');
        this.elements.logoUploadBtn = document.getElementById('logoUploadBtn');
        this.elements.logoPreview = document.getElementById('logoPreview');
        this.elements.logoImage = document.getElementById('logoImage');
        this.elements.removeLogo = document.getElementById('removeLogo');

        // Preview elements
        this.elements.qrCanvas = document.getElementById('qrCanvas');
        this.elements.qrType = document.getElementById('qrType');
        this.elements.qrSizeDisplay = document.getElementById('qrSizeDisplay');
        this.elements.qrFormat = document.getElementById('qrFormat');

        // Validate required elements
        const requiredElements = ['qrCanvas', 'downloadQR', 'resetQR'];
        const missingElements = requiredElements.filter(id => !this.elements[id]);

        if (missingElements.length > 0) {
            throw new Error(`Required DOM elements not found: ${missingElements.join(', ')}`);
        }

        console.log('🎯 QR Generator DOM elements initialized');
    }

    /**
     * Initialize components
     */
    initializeComponents() {
        // Initialize operations handler
        this.operations = new window.ToolShelf.QROperations(this);

        // Initialize bulk processor
        this.bulkProcessor = new window.ToolShelf.QRBulkProcessor(this);
        this.bulkProcessor.init();

        // Initialize UI handlers
        this.uiHandlers = new window.ToolShelf.QRUIHandlers(this);
        this.uiHandlers.init();

        console.log('🔧 QR Generator components initialized');
    }

    /**
     * Setup initial state
     */
    setupInitialState() {
        // Set default values
        if (this.elements.qrSize) this.elements.qrSize.value = '400';
        if (this.elements.qrMargin) this.elements.qrMargin.value = '2';
        if (this.elements.foregroundColor) this.elements.foregroundColor.value = '#000000';
        if (this.elements.backgroundColor) this.elements.backgroundColor.value = '#ffffff';

        // Set initial QR type
        this.currentType = 'url';
        this.currentFormat = 'png';

        // Update initial display
        this.uiHandlers.updateSizeDisplay();
        this.uiHandlers.updateQRStats();

        // Initialize Help Modal
        if (window.ToolShelf.HelpModal) {
            window.ToolShelf.HelpModal.init();
        }

        console.log('🎛️ QR Generator initial state configured');
    }

    /**
     * Generate QR code (public API)
     */
    async generateQR() {
        try {
            // Validate input
            const errors = this.uiHandlers.getValidationErrors();
            if (errors.length > 0) {
                this.uiHandlers.showValidationErrors(errors);
                return null;
            }

            const result = await this.operations.generateQR();

            if (result) {
                this.stats.qrCodesGenerated++;

                // Track analytics
                if (window.ToolShelf.Analytics) {
                    window.ToolShelf.Analytics.trackToolUsage('qr_generator', 'generate', {
                        type: this.currentType
                    });
                }
            }

            return result;
        } catch (error) {
            this.handleError(error, 'Failed to generate QR code');
            return null;
        }
    }

    /**
     * Download QR code (public API)
     */
    async downloadQR(format = null) {
        try {
            const downloadFormat = format || this.currentFormat;
            await this.uiHandlers.downloadCurrentQR();

            this.stats.downloadsCount++;

            return true;
        } catch (error) {
            this.handleError(error, 'Failed to download QR code');
            return false;
        }
    }

    /**
     * Reset all settings (public API)
     */
    resetAll() {
        try {
            this.uiHandlers.resetAll();

            // Reset internal state
            this.currentType = 'url';
            this.currentFormat = 'png';
            this.currentLogo = null;

            console.log('🔄 QR Generator reset completed');

        } catch (error) {
            this.handleError(error, 'Failed to reset QR generator');
        }
    }

    /**
     * Switch QR type (public API)
     */
    switchType(type) {
        const validTypes = ['url', 'wifi', 'contact', 'sms', 'email', 'text', 'bulk'];

        if (!validTypes.includes(type)) {
            throw new Error(`Invalid QR type: ${type}`);
        }

        this.uiHandlers.switchQRType(type);
    }

    /**
     * Set customization options (public API)
     */
    setCustomization(options = {}) {
        try {
            if (options.size && this.elements.qrSize) {
                this.elements.qrSize.value = options.size;
            }

            if (options.margin && this.elements.qrMargin) {
                this.elements.qrMargin.value = options.margin;
            }

            if (options.foregroundColor && this.elements.foregroundColor) {
                this.elements.foregroundColor.value = options.foregroundColor;
            }

            if (options.backgroundColor && this.elements.backgroundColor) {
                this.elements.backgroundColor.value = options.backgroundColor;
            }

            if (options.format) {
                this.uiHandlers.switchExportFormat(options.format);
            }

            // Update QR code with new settings
            this.uiHandlers.updateQRCode();

        } catch (error) {
            this.handleError(error, 'Failed to set customization options');
        }
    }

    /**
     * Set QR data programmatically (public API)
     */
    setQRData(type, data) {
        try {
            this.switchType(type);

            switch (type) {
                case 'url':
                    if (this.elements.urlInput) this.elements.urlInput.value = data;
                    break;
                case 'text':
                    if (this.elements.textContent) this.elements.textContent.value = data;
                    break;
                case 'wifi':
                    if (data.ssid && this.elements.wifiSSID) this.elements.wifiSSID.value = data.ssid;
                    if (data.password && this.elements.wifiPassword) this.elements.wifiPassword.value = data.password;
                    if (data.security && this.elements.wifiSecurity) this.elements.wifiSecurity.value = data.security;
                    if (data.hidden !== undefined && this.elements.wifiHidden) this.elements.wifiHidden.checked = data.hidden;
                    break;
                case 'contact':
                    if (data.name && this.elements.contactName) this.elements.contactName.value = data.name;
                    if (data.phone && this.elements.contactPhone) this.elements.contactPhone.value = data.phone;
                    if (data.email && this.elements.contactEmail) this.elements.contactEmail.value = data.email;
                    if (data.organization && this.elements.contactOrg) this.elements.contactOrg.value = data.organization;
                    break;
                case 'sms':
                    if (data.number && this.elements.smsNumber) this.elements.smsNumber.value = data.number;
                    if (data.message && this.elements.smsMessage) this.elements.smsMessage.value = data.message;
                    break;
                case 'email':
                    if (data.to && this.elements.emailTo) this.elements.emailTo.value = data.to;
                    if (data.subject && this.elements.emailSubject) this.elements.emailSubject.value = data.subject;
                    if (data.body && this.elements.emailBody) this.elements.emailBody.value = data.body;
                    break;
            }

            // Update QR code
            setTimeout(() => this.uiHandlers.updateQRCode(), 100);

        } catch (error) {
            this.handleError(error, 'Failed to set QR data');
        }
    }

    /**
     * Upload logo (public API)
     */
    async uploadLogo(file) {
        try {
            await this.uiHandlers.handleLogoUpload([file]);
            this.stats.logoUploads++;
            return true;
        } catch (error) {
            this.handleError(error, 'Failed to upload logo');
            return false;
        }
    }

    /**
     * Remove logo (public API)
     */
    removeLogo() {
        try {
            this.uiHandlers.removeLogo();
            return true;
        } catch (error) {
            this.handleError(error, 'Failed to remove logo');
            return false;
        }
    }

    /**
     * Get current QR data (public API)
     */
    getCurrentQRData() {
        try {
            const data = this.operations.buildQRData();
            const options = this.operations.buildQROptions();
            const stats = this.operations.getQRStats();

            return {
                type: this.currentType,
                format: this.currentFormat,
                data: data,
                options: options,
                stats: stats,
                hasLogo: !!this.currentLogo
            };
        } catch (error) {
            this.handleError(error, 'Failed to get current QR data');
            return null;
        }
    }

    /**
     * Get QR generator statistics (public API)
     */
    getStats() {
        const baseStats = this.getPerformanceStats();
        const bulkStats = this.bulkProcessor.getStats();

        return {
            ...baseStats,
            ...this.stats,
            currentType: this.currentType,
            currentFormat: this.currentFormat,
            hasLogo: !!this.currentLogo,
            bulk: bulkStats
        };
    }

    /**
     * Export configuration (public API)
     */
    exportConfig() {
        try {
            const config = {
                type: this.currentType,
                format: this.currentFormat,
                customization: {
                    size: this.elements.qrSize?.value,
                    margin: this.elements.qrMargin?.value,
                    foregroundColor: this.elements.foregroundColor?.value,
                    backgroundColor: this.elements.backgroundColor?.value
                },
                timestamp: new Date().toISOString()
            };

            // Add current form data
            const currentData = this.getCurrentQRData();
            if (currentData && currentData.data) {
                config.data = currentData.data;
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

            // Import type
            if (config.type) {
                this.switchType(config.type);
            }

            // Import customization
            if (config.customization) {
                this.setCustomization(config.customization);
            }

            // Import data
            if (config.data && config.type) {
                this.setQRData(config.type, config.data);
            }

            this.showToast('Configuration imported successfully', 'success');
            return true;

        } catch (error) {
            this.handleError(error, 'Failed to import configuration');
            return false;
        }
    }

    /**
     * Download sample CSV templates (public API)
     */
    downloadSampleCSV(type = 'urls') {
        try {
            this.bulkProcessor.downloadSampleCSV(type);
            return true;
        } catch (error) {
            this.handleError(error, 'Failed to download sample CSV');
            return false;
        }
    }

    /**
     * Tool becomes visible
     */
    onShow() {
        super.onShow();

        // Focus first input of current type
        const activeForm = document.querySelector('.qr-form.active');
        if (activeForm) {
            const firstInput = activeForm.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }

    /**
     * Tool becomes hidden
     */
    onHide() {
        super.onHide();

        // Save current state
        const state = this.exportState();
        window.ToolShelf.Utils.storage.set('qr_generator_state', state);
    }

    /**
     * Export tool state
     */
    exportState() {
        const baseState = super.exportState();

        return {
            ...baseState,
            currentType: this.currentType,
            currentFormat: this.currentFormat,
            hasLogo: !!this.currentLogo,
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

            if (state.currentType) {
                this.currentType = state.currentType;
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

            console.log('📥 QR Generator state imported successfully');

        } catch (error) {
            this.handleError(error, 'Failed to import state');
        }
    }

    /**
     * Handle errors with QR-specific context
     */
    handleError(error, userMessage = 'QR Generator error occurred', context = {}) {
        const qrContext = {
            ...context,
            currentType: this.currentType,
            currentFormat: this.currentFormat,
            hasLogo: !!this.currentLogo,
            qrStats: this.operations?.getQRStats() || {}
        };

        return super.handleError(error, userMessage, qrContext);
    }

    /**
     * Cleanup and destroy
     */
    destroy() {
        try {
            // Save final state
            const state = this.exportState();
            window.ToolShelf.Utils.storage.set('qr_generator_state', state);

            // Clean up components
            if (this.operations) {
                this.operations = null;
            }

            if (this.bulkProcessor) {
                this.bulkProcessor.reset();
                this.bulkProcessor = null;
            }

            if (this.uiHandlers) {
                this.uiHandlers = null;
            }

            // Clean up resources
            if (this.currentLogo) {
                URL.revokeObjectURL(this.currentLogo.src);
                this.currentLogo = null;
            }

            // Clear elements
            this.elements = {};

            super.destroy();
            console.log('🗑️ QR Generator destroyed successfully');

        } catch (error) {
            console.error('Error during QR Generator cleanup:', error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof QRious === 'undefined') {
        console.error('❌ QRious library not loaded. QR Generator requires qrious.js');
        return;
    }

    if (typeof JSZip === 'undefined') {
        console.warn('⚠️ JSZip library not loaded. Bulk generation will not work');
    }

    if (typeof Papa === 'undefined') {
        console.warn('⚠️ PapaParse library not loaded. CSV upload will not work');
    }

    console.log('✅ QR Generator dependencies loaded successfully');
});