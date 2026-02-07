/**
 * ToolShelf QR Code UI Handlers
 * Manages all UI interactions and form handling
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.QRUIHandlers = class QRUIHandlers {
    constructor(generator) {
        this.generator = generator;
        this.debouncedUpdate = null;
    }

    /**
     * Initialize UI handlers
     */
    init() {
        this.setupTypeTabHandlers();
        this.setupFormHandlers();
        this.setupCustomizationHandlers();
        this.setupExportHandlers();
        this.setupLogoHandlers();
        // this.setupKeyboardShortcuts();

        console.log('🎨 QR UI Handlers initialized');
    }

    /**
     * Setup QR type tab handlers
     */
    setupTypeTabHandlers() {
        const tabs = document.querySelectorAll('.qr-type-tab');

        tabs.forEach(tab => {
            this.generator.addEventListener(tab, 'click', () => {
                const type = tab.dataset.type;
                this.switchQRType(type);
            });
        });
    }

    /**
     * Switch QR type and update UI
     */
    switchQRType(type) {
        if (window.ToolShelf?.Analytics && this.generator.currentType !== type) {
            window.ToolShelf.Analytics.trackEvent('feature_used', {
                tool: 'qr_generator',
                feature: `switch_to_${type}`
            });
        }
        // Update current type
        this.generator.currentType = type;

        // Update tab states
        document.querySelectorAll('.qr-type-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });

        // Show/hide appropriate forms
        document.querySelectorAll('.qr-form').forEach(form => {
            form.classList.toggle('active', form.id === `${type}-form`);
        });

        // Update QR type display
        const qrTypeElement = this.generator.elements.qrType;
        if (qrTypeElement) {
            qrTypeElement.textContent = type.toUpperCase();
        }

        // Update QR code
        this.updateQRCode();

        // Handle bulk form special case
        if (type === 'bulk') {
            this.generator.bulkProcessor.reset();
        }
    }

    /**
     * Setup form input handlers
     */
    setupFormHandlers() {
        // Create debounced update function
        this.debouncedUpdate = window.ToolShelf.Utils.debounce(() => {
            this.updateQRCode();
        }, 300);

        // Setup handlers for each form type
        this.setupURLFormHandlers();
        this.setupWiFiFormHandlers();
        this.setupContactFormHandlers();
        this.setupSMSFormHandlers();
        this.setupEmailFormHandlers();
        this.setupTextFormHandlers();
    }

    /**
     * Setup URL form handlers
     */
    setupURLFormHandlers() {
        const urlInput = this.generator.elements.urlInput;
        if (urlInput) {
            this.generator.addEventListener(urlInput, 'input', this.debouncedUpdate);
            this.generator.addEventListener(urlInput, 'paste', () => {
                setTimeout(this.debouncedUpdate, 100);
            });
        }
    }

    /**
     * Setup WiFi form handlers
     */
    setupWiFiFormHandlers() {
        const wifiInputs = [
            this.generator.elements.wifiSSID,
            this.generator.elements.wifiPassword,
            this.generator.elements.wifiSecurity,
            this.generator.elements.wifiHidden
        ].filter(Boolean);

        wifiInputs.forEach(input => {
            const eventType = input.type === 'checkbox' ? 'change' : 'input';
            this.generator.addEventListener(input, eventType, this.debouncedUpdate);
        });
    }

    /**
     * Setup Contact form handlers
     */
    setupContactFormHandlers() {
        const contactInputs = [
            this.generator.elements.contactName,
            this.generator.elements.contactPhone,
            this.generator.elements.contactEmail,
            this.generator.elements.contactOrg
        ].filter(Boolean);

        contactInputs.forEach(input => {
            this.generator.addEventListener(input, 'input', this.debouncedUpdate);
        });
    }

    /**
     * Setup SMS form handlers
     */
    setupSMSFormHandlers() {
        const smsInputs = [
            this.generator.elements.smsNumber,
            this.generator.elements.smsMessage
        ].filter(Boolean);

        smsInputs.forEach(input => {
            this.generator.addEventListener(input, 'input', this.debouncedUpdate);
        });
    }

    /**
     * Setup Email form handlers
     */
    setupEmailFormHandlers() {
        const emailInputs = [
            this.generator.elements.emailTo,
            this.generator.elements.emailSubject,
            this.generator.elements.emailBody
        ].filter(Boolean);

        emailInputs.forEach(input => {
            this.generator.addEventListener(input, 'input', this.debouncedUpdate);
        });
    }

    /**
     * Setup Text form handlers
     */
    setupTextFormHandlers() {
        const textInput = this.generator.elements.textContent;
        if (textInput) {
            this.generator.addEventListener(textInput, 'input', this.debouncedUpdate);
        }
    }

    /**
     * Setup customization handlers
     */
    setupCustomizationHandlers() {
        // Color inputs
        const colorInputs = [
            this.generator.elements.foregroundColor,
            this.generator.elements.backgroundColor
        ].filter(Boolean);

        colorInputs.forEach(input => {
            this.generator.addEventListener(input, 'change', this.debouncedUpdate);
        });

        // Size and margin selects
        const sizeInputs = [
            this.generator.elements.qrSize,
            this.generator.elements.qrMargin
        ].filter(Boolean);

        sizeInputs.forEach(input => {
            this.generator.addEventListener(input, 'change', () => {
                this.updateSizeDisplay();
                this.updateQRCode();
            });
        });
    }

    /**
     * Setup export format handlers
     */
    setupExportHandlers() {
        // Format buttons
        const formatBtns = document.querySelectorAll('.format-btn');
        formatBtns.forEach(btn => {
            this.generator.addEventListener(btn, 'click', () => {
                this.switchExportFormat(btn.dataset.format);
            });
        });

        // Download button
        const downloadBtn = this.generator.elements.downloadQR;
        if (downloadBtn) {
            this.generator.addEventListener(downloadBtn, 'click', () => {
                this.downloadCurrentQR();
            });
        }

        // Reset button
        const resetBtn = this.generator.elements.resetQR;
        if (resetBtn) {
            this.generator.addEventListener(resetBtn, 'click', () => {
                this.resetAll();
            });
        }
    }

    /**
     * Setup logo upload handlers
     */
    setupLogoHandlers() {
        const logoInput = this.generator.elements.logoInput;
        const logoUploadBtn = this.generator.elements.logoUploadBtn;
        const removeLogo = this.generator.elements.removeLogo;

        if (logoUploadBtn) {
            this.generator.addEventListener(logoUploadBtn, 'click', () => {
                logoInput?.click();
            });
        }

        if (logoInput) {
            this.generator.addEventListener(logoInput, 'change', (e) => {
                this.handleLogoUpload(e.target.files);
            });
        }

        if (removeLogo) {
            this.generator.addEventListener(removeLogo, 'click', () => {
                this.removeLogo();
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl+d', callback: () => this.downloadCurrentQR(), description: 'Download QR code' },
            { key: 'Ctrl+r', callback: () => this.resetAll(), description: 'Reset all settings' },
            { key: 'Ctrl+1', callback: () => this.switchQRType('url'), description: 'Switch to URL' },
            { key: 'Ctrl+2', callback: () => this.switchQRType('wifi'), description: 'Switch to WiFi' },
            { key: 'Ctrl+3', callback: () => this.switchQRType('contact'), description: 'Switch to Contact' },
            { key: 'Ctrl+4', callback: () => this.switchQRType('text'), description: 'Switch to Text' }
        ];

        this.generator.registerShortcuts(shortcuts);
    }

    /**
     * Update QR code display
     */
    async updateQRCode() {
        if (this.generator.currentType === 'bulk') {
            return; // Bulk mode doesn't show preview
        }

        try {
            const qrResult = await this.generator.operations.generateQR();

            if (qrResult) {
                this.displayQRCode(qrResult);
                this.updateDownloadButton(true);
            } else {
                this.generator.operations.clearQRDisplay();
                this.updateDownloadButton(false);
            }

        } catch (error) {
            this.generator.handleError(error, 'Failed to update QR code');
            this.updateDownloadButton(false);
        }
    }

    /**
     * Display QR code in preview area
     */
    displayQRCode(qrResult) {
        const qrCanvas = this.generator.elements.qrCanvas;
        if (!qrCanvas || !qrResult.canvas) return;

        // Clear existing content
        qrCanvas.innerHTML = '';

        // Apply logo if available
        if (this.generator.currentLogo) {
            this.generator.operations.applyLogoToCanvas(qrResult.canvas, this.generator.currentLogo)
                .then(canvas => {
                    qrCanvas.appendChild(canvas);
                })
                .catch(error => {
                    console.warn('Failed to apply logo:', error);
                    qrCanvas.appendChild(qrResult.canvas);
                });
        } else {
            qrCanvas.appendChild(qrResult.canvas);
        }

        // Update stats
        this.updateQRStats();
    }

    /**
     * Update size display
     */
    updateSizeDisplay() {
        const sizeElement = this.generator.elements.qrSizeDisplay;
        const sizeSelect = this.generator.elements.qrSize;

        if (sizeElement && sizeSelect) {
            sizeElement.textContent = `${sizeSelect.value}px`;
        }
    }

    /**
     * Update QR statistics
     */
    updateQRStats() {
        const stats = this.generator.operations.getQRStats();

        // Update type display
        const qrTypeElement = this.generator.elements.qrType;
        if (qrTypeElement) {
            qrTypeElement.textContent = stats.type.toUpperCase();
        }

        // Update size display
        this.updateSizeDisplay();

        // Update format display
        const qrFormatElement = this.generator.elements.qrFormat;
        if (qrFormatElement) {
            const activeFormat = document.querySelector('.format-btn.active');
            qrFormatElement.textContent = activeFormat ? activeFormat.dataset.format.toUpperCase() : 'PNG';
        }
    }

    /**
     * Switch export format
     */
    switchExportFormat(format) {
        // Update button states
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === format);
        });

        // Update format display
        const qrFormatElement = this.generator.elements.qrFormat;
        if (qrFormatElement) {
            qrFormatElement.textContent = format.toUpperCase();
        }

        this.generator.currentFormat = format;
    }

    /**
     * Handle logo upload
     */
    async handleLogoUpload(files) {
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.generator.showToast('Please upload an image file', 'error');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            this.generator.showToast('Image too large. Maximum size is 2MB', 'error');
            return;
        }

        try {
            const logoImage = await this.createImageFromFile(file);
            this.generator.currentLogo = logoImage;

            this.showLogoPreview(logoImage);
            this.updateQRCode();

            this.generator.showToast('Logo uploaded successfully', 'success');

        } catch (error) {
            this.generator.handleError(error, 'Failed to upload logo');
        }
    }

    /**
     * Create image element from file
     */
    createImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            img.src = url;
        });
    }

    /**
     * Show logo preview
     */
    showLogoPreview(logoImage) {
        const logoPreview = this.generator.elements.logoPreview;
        const logoImageElement = this.generator.elements.logoImage;

        if (logoPreview && logoImageElement) {
            logoImageElement.src = logoImage.src;
            logoPreview.style.display = 'block';
        }
    }

    /**
     * Remove logo
     */
    removeLogo() {
        this.generator.currentLogo = null;

        const logoPreview = this.generator.elements.logoPreview;
        const logoInput = this.generator.elements.logoInput;

        if (logoPreview) logoPreview.style.display = 'none';
        if (logoInput) logoInput.value = '';

        this.updateQRCode();
        this.generator.showToast('Logo removed', 'success');
    }

    /**
     * Download current QR code
     */
    async downloadCurrentQR() {
        try {
            const format = this.generator.currentFormat;
            const exportData = await this.generator.operations.exportQR(format);

            if (format === 'svg') {
                this.downloadSVG(exportData.data, exportData.filename);
            } else {
                this.downloadDataURL(exportData.data, exportData.filename);
            }

            this.generator.showToast(`QR code downloaded as ${format.toUpperCase()}`, 'success');

            // Track analytics
            if (window.ToolShelf?.Analytics) {
                window.ToolShelf.Analytics.trackEvent('content_downloaded', {
                    tool: 'qr_generator',
                    format: format,
                    qr_type: this.generator.currentType // Track if it was WiFi, URL, etc.
                });
            }

        } catch (error) {
            this.generator.handleError(error, 'Failed to download QR code');
        }
    }

    /**
     * Download data URL as file
     */
    downloadDataURL(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Download SVG as file
     */
    downloadSVG(svgContent, filename) {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    /**
     * Update download button state
     */
    updateDownloadButton(enabled) {
        const downloadBtn = this.generator.elements.downloadQR;
        if (downloadBtn) {
            downloadBtn.disabled = !enabled;
        }
    }

    /**
     * Reset all settings and forms
     */
    resetAll() {
        // Clear all form inputs
        document.querySelectorAll('.qr-form input, .qr-form select, .qr-form textarea').forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type === 'color') {
                if (input.id === 'foregroundColor') input.value = '#000000';
                else if (input.id === 'backgroundColor') input.value = '#ffffff';
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });

        // Reset to URL type
        this.switchQRType('url');

        // Reset customization
        const qrSize = this.generator.elements.qrSize;
        const qrMargin = this.generator.elements.qrMargin;

        if (qrSize) qrSize.value = '400';
        if (qrMargin) qrMargin.value = '2';

        // Remove logo
        this.removeLogo();

        // Reset export format to PNG
        this.switchExportFormat('png');

        // Reset bulk processor
        this.generator.bulkProcessor.reset();

        // Clear QR display
        this.generator.operations.clearQRDisplay();
        this.updateDownloadButton(false);

        this.generator.showToast('All settings reset', 'success');
    }

    /**
     * Get form validation errors
     */
    getValidationErrors() {
        const errors = [];
        const type = this.generator.currentType;

        switch (type) {
            case 'url':
                const url = this.generator.elements.urlInput?.value?.trim();
                if (!url) errors.push('URL is required');
                break;

            case 'wifi':
                const ssid = this.generator.elements.wifiSSID?.value?.trim();
                if (!ssid) errors.push('WiFi network name (SSID) is required');
                break;

            case 'contact':
                const name = this.generator.elements.contactName?.value?.trim();
                const phone = this.generator.elements.contactPhone?.value?.trim();
                const email = this.generator.elements.contactEmail?.value?.trim();
                if (!name && !phone && !email) {
                    errors.push('At least one contact field is required');
                }
                break;

            case 'sms':
                const smsNumber = this.generator.elements.smsNumber?.value?.trim();
                if (!smsNumber) errors.push('Phone number is required');
                break;

            case 'email':
                const emailTo = this.generator.elements.emailTo?.value?.trim();
                if (!emailTo) errors.push('Email address is required');
                break;

            case 'text':
                const text = this.generator.elements.textContent?.value?.trim();
                if (!text) errors.push('Text content is required');
                break;
        }

        return errors;
    }

    /**
     * Show validation errors
     */
    showValidationErrors(errors) {
        if (errors.length > 0) {
            this.generator.showToast(errors[0], 'error');
        }
    }
};