/**
 * ToolShelf QR Code Operations
 * Core QR generation and data handling logic
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.QROperations = class QROperations {
    constructor(generator) {
        this.generator = generator;
        this.currentQRData = null;
        this.currentQROptions = {};

        // QR Code generation options
        this.defaultOptions = {
            width: 400,
            height: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92
        };
    }

    /**
     * Generate QR code based on current type and input
     */
    async generateQR() {
        try {
            const qrData = this.buildQRData();
            if (!qrData) {
                this.clearQRDisplay();
                return null;
            }

            const options = this.buildQROptions();
            const qrResult = await this.createQRCode(qrData, options);

            this.currentQRData = qrData;
            this.currentQROptions = options;

            return qrResult;
        } catch (error) {
            this.generator.handleError(error, 'Failed to generate QR code');
            return null;
        }
    }

    /**
     * Build QR data string based on current type and form inputs
     */
    buildQRData() {
        const currentType = this.generator.currentType;

        switch (currentType) {
            case 'url':
                return this.buildURLData();
            case 'wifi':
                return this.buildWiFiData();
            case 'contact':
                return this.buildContactData();
            case 'sms':
                return this.buildSMSData();
            case 'email':
                return this.buildEmailData();
            case 'text':
                return this.buildTextData();
            default:
                return null;
        }
    }

    /**
     * Build URL QR data
     */
    buildURLData() {
        const url = this.generator.elements.urlInput?.value?.trim();

        if (!url) return null;

        // Add protocol if missing
        if (!url.match(/^https?:\/\//)) {
            return `https://${url}`;
        }

        return url;
    }

    /**
     * Build WiFi QR data
     */
    buildWiFiData() {
        const ssid = this.generator.elements.wifiSSID?.value?.trim();
        const password = this.generator.elements.wifiPassword?.value?.trim();
        const security = this.generator.elements.wifiSecurity?.value || 'WPA';
        const hidden = this.generator.elements.wifiHidden?.checked || false;

        if (!ssid) return null;

        // WiFi QR format: WIFI:T:WPA;S:mynetwork;P:mypass;H:false;;
        const parts = [
            `T:${security}`,
            `S:${this.escapeWiFiValue(ssid)}`,
            password ? `P:${this.escapeWiFiValue(password)}` : '',
            `H:${hidden}`
        ].filter(Boolean);

        return `WIFI:${parts.join(';')};;`;
    }

    /**
     * Build Contact (vCard) QR data
     */
    buildContactData() {
        const name = this.generator.elements.contactName?.value?.trim();
        const phone = this.generator.elements.contactPhone?.value?.trim();
        const email = this.generator.elements.contactEmail?.value?.trim();
        const org = this.generator.elements.contactOrg?.value?.trim();

        if (!name && !phone && !email) return null;

        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            name ? `FN:${name}` : '',
            phone ? `TEL:${phone}` : '',
            email ? `EMAIL:${email}` : '',
            org ? `ORG:${org}` : '',
            'END:VCARD'
        ].filter(Boolean).join('\n');

        return vcard;
    }

    /**
     * Build SMS QR data
     */
    buildSMSData() {
        const number = this.generator.elements.smsNumber?.value?.trim();
        const message = this.generator.elements.smsMessage?.value?.trim();

        if (!number) return null;

        // SMS format: sms:+1234567890?body=message
        if (message) {
            return `sms:${number}?body=${encodeURIComponent(message)}`;
        } else {
            return `sms:${number}`;
        }
    }

    /**
     * Build Email QR data
     */
    buildEmailData() {
        const to = this.generator.elements.emailTo?.value?.trim();
        const subject = this.generator.elements.emailSubject?.value?.trim();
        const body = this.generator.elements.emailBody?.value?.trim();

        if (!to) return null;

        // Email format: mailto:email@example.com?subject=Subject&body=Body
        const params = [];
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);

        const queryString = params.length > 0 ? `?${params.join('&')}` : '';
        return `mailto:${to}${queryString}`;
    }

    /**
     * Build Text QR data
     */
    buildTextData() {
        const text = this.generator.elements.textContent?.value?.trim();
        return text || null;
    }

    /**
     * Build QR generation options
     */
    buildQROptions() {
        const size = parseInt(this.generator.elements.qrSize?.value) || 400;
        const margin = parseInt(this.generator.elements.qrMargin?.value) || 2;
        const foreground = this.generator.elements.foregroundColor?.value || '#000000';
        const background = this.generator.elements.backgroundColor?.value || '#ffffff';

        return {
            ...this.defaultOptions,
            width: size,
            height: size,
            margin: margin,
            color: {
                dark: foreground,
                light: background
            }
        };
    }

    /**
     * Create QR code using QRious library
     */
    async createQRCode(data, options) {
        return new Promise((resolve, reject) => {
            try {
                // Create canvas element
                const canvas = document.createElement('canvas');

                // Use QRious - much more reliable for browsers
                const qr = new QRious({
                    element: canvas,
                    value: data,
                    size: options.width,
                    background: options.color.light,
                    foreground: options.color.dark,
                    padding: options.margin,
                    backgroundAlpha: 1,
                    foregroundAlpha: 1,
                    level: 'M' // Error correction level
                });

                resolve({
                    canvas: canvas,
                    data: data,
                    options: options
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Create SVG QR code using QRious (converts canvas to SVG)
     */
    async createQRCodeSVG(data, options) {
        return new Promise((resolve, reject) => {
            try {
                // Create QR on canvas first
                const canvas = document.createElement('canvas');

                const qr = new QRious({
                    element: canvas,
                    value: data,
                    size: options.width,
                    background: options.color.light,
                    foreground: options.color.dark,
                    padding: options.margin
                });

                // Convert canvas to SVG with embedded image
                const dataURL = canvas.toDataURL('image/png');
                const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${options.width}" height="${options.width}" viewBox="0 0 ${options.width} ${options.width}">
    <image href="${dataURL}" width="${options.width}" height="${options.width}"/>
</svg>`;

                resolve({
                    svg: svg,
                    data: data,
                    options: options
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Apply logo to QR code canvas
     */
    async applyLogoToCanvas(canvas, logoImage) {
        try {
            const ctx = canvas.getContext('2d');
            const canvasSize = canvas.width;

            // Logo should be about 20% of QR code size
            const logoSize = Math.round(canvasSize * 0.2);
            const logoX = (canvasSize - logoSize) / 2;
            const logoY = (canvasSize - logoSize) / 2;

            // Create white background circle for logo
            const bgSize = logoSize + 20;
            const bgX = (canvasSize - bgSize) / 2;
            const bgY = (canvasSize - bgSize) / 2;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bgX + bgSize / 2, bgY + bgSize / 2, bgSize / 2, 0, 2 * Math.PI);
            ctx.fill();

            // Draw logo
            ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

            return canvas;
        } catch (error) {
            console.warn('Failed to apply logo to QR code:', error);
            return canvas;
        }
    }

    /**
     * Export QR code in specified format
     */
    async exportQR(format = 'png') {
        if (!this.currentQRData) {
            throw new Error('No QR code to export');
        }

        const options = { ...this.currentQROptions };
        const logoImage = this.generator.currentLogo;

        if (format === 'svg') {
            const result = await this.createQRCodeSVG(this.currentQRData, options);
            return {
                type: 'svg',
                data: result.svg,
                filename: this.generateFilename('svg')
            };
        } else {
            const result = await this.createQRCode(this.currentQRData, options);
            let canvas = result.canvas;

            // Apply logo if available
            if (logoImage) {
                canvas = await this.applyLogoToCanvas(canvas, logoImage);
            }

            const dataURL = canvas.toDataURL('image/png', 0.92);
            return {
                type: 'png',
                data: dataURL,
                filename: this.generateFilename('png')
            };
        }
    }

    /**
     * Generate filename for download
     */
    generateFilename(extension) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
        const type = this.generator.currentType;
        return `toolshelf-qr-${type}-${timestamp}.${extension}`;
    }

    /**
     * Clear QR display
     */
    clearQRDisplay() {
        const qrCanvas = this.generator.elements.qrCanvas;
        if (qrCanvas) {
            qrCanvas.innerHTML = `
                <div class="qr-placeholder">
                    <i class="fas fa-qrcode"></i>
                    <p>QR code will appear here</p>
                </div>
            `;
        }

        this.currentQRData = null;
        this.currentQROptions = {};
    }

    /**
     * Escape special characters in WiFi values
     */
    escapeWiFiValue(value) {
        return value.replace(/([\\";,:])/g, '\\$1');
    }

    /**
     * Validate QR data before generation
     */
    validateQRData(data) {
        if (!data || typeof data !== 'string') {
            return false;
        }

        // Check data length (QR codes have limits)
        const maxLength = 2953; // For alphanumeric mode
        if (data.length > maxLength) {
            throw new Error(`QR code data too long. Maximum ${maxLength} characters allowed.`);
        }

        return true;
    }

    /**
     * Get QR code statistics
     */
    getQRStats() {
        if (!this.currentQRData || !this.currentQROptions) {
            return {
                hasData: false,
                dataLength: 0,
                size: 0,
                type: this.generator.currentType
            };
        }

        return {
            hasData: true,
            dataLength: this.currentQRData.length,
            size: this.currentQROptions.width,
            type: this.generator.currentType,
            errorCorrection: this.currentQROptions.errorCorrectionLevel,
            margin: this.currentQROptions.margin
        };
    }

    /**
     * Test QR code generation without displaying
     */
    async testQRGeneration(data, options) {
        try {
            const testResult = await this.createQRCode(data, options);
            return { success: true, result: testResult };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};