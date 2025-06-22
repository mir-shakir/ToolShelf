/**
 * ToolShelf QR Code Bulk Processor
 * Handles CSV upload and bulk QR code generation
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.QRBulkProcessor = class QRBulkProcessor {
    constructor(generator) {
        this.generator = generator;
        this.bulkData = [];
        this.processedCount = 0;
        this.maxBulkSize = 500; // Maximum QR codes in one batch
        this.isProcessing = false;
    }

    /**
     * Initialize bulk processor
     */
    init() {
        this.setupFileUpload();
        this.setupBulkGeneration();
        console.log('📦 QR Bulk Processor initialized');
    }

    /**
     * Setup file upload handling
     */
    setupFileUpload() {
        const uploadArea = this.generator.elements.bulkUploadArea;
        const fileInput = this.generator.elements.csvFileInput;

        if (!uploadArea || !fileInput) return;

        // Drag and drop events
        this.generator.addEventListener(uploadArea, 'dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        this.generator.addEventListener(uploadArea, 'dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });

        this.generator.addEventListener(uploadArea, 'drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFileUpload(e.dataTransfer.files);
        });

        // Click to upload
        this.generator.addEventListener(uploadArea, 'click', () => {
            fileInput.click();
        });

        // File input change
        this.generator.addEventListener(fileInput, 'change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }

    /**
     * Setup bulk generation button
     */
    setupBulkGeneration() {
        const generateBtn = this.generator.elements.generateBulk;
        if (!generateBtn) return;

        this.generator.addEventListener(generateBtn, 'click', () => {
            this.generateBulkQRCodes();
        });
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(files) {
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.generator.showToast('Please upload a CSV file', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.generator.showToast('File too large. Maximum size is 5MB', 'error');
            return;
        }

        try {
            const csvText = await this.readFileAsText(file);
            await this.parseCSVData(csvText);

            this.generator.showToast(`Loaded ${this.bulkData.length} items from CSV`, 'success');
            this.showBulkPreview();

        } catch (error) {
            this.generator.handleError(error, 'Failed to process CSV file');
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
     * Parse CSV data using Papa Parse
     */
    async parseCSVData(csvText) {
        return new Promise((resolve, reject) => {
            try {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header) => header.toLowerCase().trim(),
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            console.warn('CSV parsing warnings:', results.errors);
                        }

                        this.bulkData = this.processParsedData(results.data);

                        if (this.bulkData.length === 0) {
                            reject(new Error('No valid data found in CSV'));
                        } else if (this.bulkData.length > this.maxBulkSize) {
                            reject(new Error(`Too many items. Maximum ${this.maxBulkSize} allowed`));
                        } else {
                            resolve(this.bulkData);
                        }
                    },
                    error: (error) => {
                        reject(new Error(`CSV parsing failed: ${error.message}`));
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Process parsed CSV data into QR-ready format
     */
    processParsedData(data) {
        const processed = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const qrItem = this.createQRItemFromRow(row, i + 1);

            if (qrItem) {
                processed.push(qrItem);
            }
        }

        return processed;
    }

    /**
     * Create QR item from CSV row
     */
    createQRItemFromRow(row, index) {
        // Try different CSV formats

        // Format 1: URL format (url, label)
        if (row.url) {
            return {
                type: 'url',
                data: this.normalizeURL(row.url),
                label: row.label || row.name || `QR-${index}`,
                filename: this.sanitizeFilename(row.label || row.name || `qr-url-${index}`)
            };
        }

        // Format 2: Contact format (name, phone, email, organization)
        if (row.name || row.phone || row.email) {
            const vcard = this.createVCardFromRow(row);
            return {
                type: 'contact',
                data: vcard,
                label: row.name || row.email || `Contact-${index}`,
                filename: this.sanitizeFilename(row.name || `qr-contact-${index}`)
            };
        }

        // Format 3: WiFi format (ssid, password, security, hidden)
        if (row.ssid) {
            const wifi = this.createWiFiFromRow(row);
            return {
                type: 'wifi',
                data: wifi,
                label: `WiFi: ${row.ssid}`,
                filename: this.sanitizeFilename(`qr-wifi-${row.ssid}`)
            };
        }

        // Format 4: SMS format (phone, message)
        if (row.phone && row.message) {
            const sms = `sms:${row.phone}?body=${encodeURIComponent(row.message)}`;
            return {
                type: 'sms',
                data: sms,
                label: `SMS to ${row.phone}`,
                filename: this.sanitizeFilename(`qr-sms-${index}`)
            };
        }

        // Format 5: Email format (email, subject, body)
        if (row.email && !row.name) {
            const email = this.createEmailFromRow(row);
            return {
                type: 'email',
                data: email,
                label: `Email to ${row.email}`,
                filename: this.sanitizeFilename(`qr-email-${index}`)
            };
        }

        // Format 6: Text format (text, label)
        if (row.text) {
            return {
                type: 'text',
                data: row.text,
                label: row.label || `Text-${index}`,
                filename: this.sanitizeFilename(row.label || `qr-text-${index}`)
            };
        }

        // Fallback: treat first column as text
        const firstValue = Object.values(row).find(val => val && val.trim());
        if (firstValue) {
            return {
                type: 'text',
                data: firstValue.trim(),
                label: `Item-${index}`,
                filename: `qr-item-${index}`
            };
        }

        return null;
    }

    /**
     * Create vCard from CSV row
     */
    createVCardFromRow(row) {
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            row.name ? `FN:${row.name}` : '',
            row.phone ? `TEL:${row.phone}` : '',
            row.email ? `EMAIL:${row.email}` : '',
            row.organization || row.org ? `ORG:${row.organization || row.org}` : '',
            'END:VCARD'
        ].filter(Boolean).join('\n');

        return vcard;
    }

    /**
     * Create WiFi string from CSV row
     */
    createWiFiFromRow(row) {
        const security = row.security || row.type || 'WPA';
        const password = row.password || row.pass || '';
        const hidden = row.hidden === 'true' || row.hidden === '1';

        const parts = [
            `T:${security}`,
            `S:${this.escapeWiFiValue(row.ssid)}`,
            password ? `P:${this.escapeWiFiValue(password)}` : '',
            `H:${hidden}`
        ].filter(Boolean);

        return `WIFI:${parts.join(';')};;`;
    }

    /**
     * Create email string from CSV row
     */
    createEmailFromRow(row) {
        const params = [];
        if (row.subject) params.push(`subject=${encodeURIComponent(row.subject)}`);
        if (row.body || row.message) params.push(`body=${encodeURIComponent(row.body || row.message)}`);

        const queryString = params.length > 0 ? `?${params.join('&')}` : '';
        return `mailto:${row.email}${queryString}`;
    }

    /**
     * Show bulk preview
     */
    showBulkPreview() {
        const uploadArea = this.generator.elements.bulkUploadArea;
        const preview = this.generator.elements.bulkPreview;
        const countElement = this.generator.elements.bulkCount;

        if (uploadArea) uploadArea.style.display = 'none';
        if (preview) preview.style.display = 'block';
        if (countElement) countElement.textContent = this.bulkData.length;
    }

    /**
     * Hide bulk preview
     */
    hideBulkPreview() {
        const uploadArea = this.generator.elements.bulkUploadArea;
        const preview = this.generator.elements.bulkPreview;

        if (uploadArea) uploadArea.style.display = 'block';
        if (preview) preview.style.display = 'none';

        this.bulkData = [];
        this.processedCount = 0;
    }

    /**
     * Generate bulk QR codes
     */
    async generateBulkQRCodes() {
        if (this.isProcessing) return;
        if (this.bulkData.length === 0) {
            this.generator.showToast('No data to process', 'error');
            return;
        }

        this.isProcessing = true;
        this.processedCount = 0;

        try {
            // Show progress
            this.generator.showToast(`Generating ${this.bulkData.length} QR codes...`, 'info', 2000);

            const zip = new JSZip();
            const options = this.generator.operations.buildQROptions();

            // Process in batches to prevent browser freeze
            const batchSize = 10;
            const totalBatches = Math.ceil(this.bulkData.length / batchSize);

            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                const start = batchIndex * batchSize;
                const end = Math.min(start + batchSize, this.bulkData.length);
                const batch = this.bulkData.slice(start, end);

                await this.processBatch(batch, zip, options);

                // Update progress
                const progress = Math.round((end / this.bulkData.length) * 100);
                this.updateProgress(progress);

                // Small delay to prevent UI freeze
                await this.delay(50);
            }

            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
            const filename = `toolshelf-qr-bulk-${timestamp}.zip`;

            saveAs(zipBlob, filename);

            this.generator.showToast(`Generated ${this.bulkData.length} QR codes successfully!`, 'success');

            // Track analytics
            if (window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackToolUsage('qr_generator', 'bulk_generation', {
                    count: this.bulkData.length
                });
            }

        } catch (error) {
            this.generator.handleError(error, 'Bulk generation failed');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process a batch of QR codes
     */
    async processBatch(batch, zip, baseOptions) {
        const promises = batch.map(async (item) => {
            try {
                const qrResult = await this.generator.operations.createQRCode(item.data, baseOptions);
                const canvas = qrResult.canvas;

                // Apply logo if available
                if (this.generator.currentLogo) {
                    await this.generator.operations.applyLogoToCanvas(canvas, this.generator.currentLogo);
                }

                // Convert to blob
                const dataURL = canvas.toDataURL('image/png', 0.92);
                const base64Data = dataURL.split(',')[1];

                // Add to ZIP
                const filename = `${item.filename}.png`;
                zip.file(filename, base64Data, { base64: true });

                this.processedCount++;

            } catch (error) {
                console.warn(`Failed to generate QR for item: ${item.label}`, error);
                // Continue with other items
            }
        });

        await Promise.all(promises);
    }

    /**
     * Update progress display
     */
    updateProgress(percentage) {
        const generateBtn = this.generator.elements.generateBulk;
        if (generateBtn) {
            generateBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Generating... ${percentage}%
            `;
        }
    }

    /**
     * Utility functions
     */
    normalizeURL(url) {
        if (!url.match(/^https?:\/\//)) {
            return `https://${url}`;
        }
        return url;
    }

    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9\-_\.]/g, '-')
            .replace(/--+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }

    escapeWiFiValue(value) {
        return value.replace(/([\\";,:])/g, '\\$1');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset bulk processor
     */
    reset() {
        this.hideBulkPreview();
        this.isProcessing = false;

        // Reset file input
        const fileInput = this.generator.elements.csvFileInput;
        if (fileInput) fileInput.value = '';

        // Reset generate button
        const generateBtn = this.generator.elements.generateBulk;
        if (generateBtn) {
            generateBtn.innerHTML = `
                <i class="fas fa-magic"></i>
                Generate All QR Codes
            `;
        }
    }

    /**
     * Get sample CSV templates
     */
    getSampleCSVTemplates() {
        return {
            urls: `url,label
https://example.com,Website
https://github.com/toolshelf,GitHub
https://google.com,Search Engine`,

            contacts: `name,phone,email,organization
John Doe,+1234567890,john@example.com,Company Inc
Jane Smith,+0987654321,jane@example.com,Tech Corp`,

            wifi: `ssid,password,security,hidden
MyNetwork,password123,WPA,false
GuestWiFi,,none,false`,

            mixed: `type,data,label
url,https://example.com,Website
text,Hello World,Greeting
email,contact@example.com,Email Us`
        };
    }

    /**
     * Download sample CSV
     */
    downloadSampleCSV(type = 'urls') {
        const templates = this.getSampleCSVTemplates();
        const csvContent = templates[type] || templates.urls;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const filename = `qr-sample-${type}.csv`;

        saveAs(blob, filename);
        this.generator.showToast(`Downloaded sample CSV: ${filename}`, 'success');
    }

    /**
     * Get bulk processor statistics
     */
    getStats() {
        return {
            totalItems: this.bulkData.length,
            processedItems: this.processedCount,
            isProcessing: this.isProcessing,
            maxBulkSize: this.maxBulkSize
        };
    }
};