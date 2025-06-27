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
        this.maxBulkSize = 100; // Reduced for browser memory safety
        this.recommendedSize = 50; // Recommended batch size
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
 * Parse CSV data with enhanced validation and limits
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
                            reject(new Error('No valid data found in CSV. Please check the format and try again.'));
                        } else if (this.bulkData.length > this.maxBulkSize) {
                            reject(new Error(`Too many items (${this.bulkData.length}). Maximum ${this.maxBulkSize} allowed. For better performance, we recommend batches of ${this.recommendedSize} or fewer.`));
                        } else if (this.bulkData.length > this.recommendedSize) {
                            // Show warning but allow processing
                            this.generator.showToast(
                                `Large batch detected (${this.bulkData.length} items). This may take a while and use significant browser memory. Consider splitting into smaller batches for better performance.`,
                                'warning',
                                8000
                            );
                        }

                        resolve(this.bulkData);
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
     * Show bulk preview with enhanced info
     */
    showBulkPreview() {
        const uploadArea = this.generator.elements.bulkUploadArea;
        const preview = this.generator.elements.bulkPreview;
        const countElement = this.generator.elements.bulkCount;
        const sizeWarning = document.getElementById('bulkSizeWarning');

        if (uploadArea) uploadArea.style.display = 'none';
        if (preview) preview.style.display = 'block';
        if (countElement) countElement.textContent = this.bulkData.length;

        // Show size warning if needed
        if (sizeWarning) {
            if (this.bulkData.length > this.recommendedSize) {
                sizeWarning.style.display = 'block';
                sizeWarning.className = this.bulkData.length > this.maxBulkSize * 0.8 ? 'warning-message error' : 'warning-message warning';
                sizeWarning.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    Large batch (${this.bulkData.length} items). Consider splitting for better performance.
                    <br><small>Recommended: ≤${this.recommendedSize} items. Maximum: ${this.maxBulkSize} items.</small>
                `;
            } else {
                sizeWarning.style.display = 'none';
            }
        }
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
 * Generate bulk QR codes with enhanced progress and completion feedback
 */
    async generateBulkQRCodes() {
        if (this.isProcessing) return;
        if (this.bulkData.length === 0) {
            this.generator.showToast('No data to process', 'error');
            return;
        }

        this.isProcessing = true;
        this.processedCount = 0;
        const startTime = Date.now();

        try {
            // Show initial progress
            this.generator.showToast(`Starting generation of ${this.bulkData.length} QR codes...`, 'info', 3000);

            const zip = new JSZip();
            const options = this.generator.operations.buildQROptions();

            // Process in smaller batches to prevent browser freeze
            const batchSize = Math.min(5, Math.max(1, Math.floor(50 / this.bulkData.length * 10)));
            const totalBatches = Math.ceil(this.bulkData.length / batchSize);

            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                const start = batchIndex * batchSize;
                const end = Math.min(start + batchSize, this.bulkData.length);
                const batch = this.bulkData.slice(start, end);

                await this.processBatch(batch, zip, options);

                // Update progress
                const progress = Math.round((end / this.bulkData.length) * 100);
                this.updateProgress(progress, end, this.bulkData.length);

                // Longer delay for larger batches to prevent browser freeze
                await this.delay(this.bulkData.length > this.recommendedSize ? 100 : 50);
            }

            // Generate and download ZIP
            this.updateProgress(100, this.bulkData.length, this.bulkData.length, 'Finalizing...');
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: "DEFLATE",
                compressionOptions: { level: 6 }
            });

            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
            const filename = `toolshelf-qr-bulk-${timestamp}.zip`;

            saveAs(zipBlob, filename);

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            // Enhanced completion message
            const successMessage = `🎉 Successfully generated ${this.bulkData.length} QR codes in ${duration}s!\n\n` +
                `📁 Downloaded: ${filename}\n` +
                `💾 File size: ${this.formatFileSize(zipBlob.size)}\n` +
                `⚡ Processing rate: ${Math.round(this.bulkData.length / parseFloat(duration))} QR codes/second`;

            this.generator.showToast(successMessage, 'success', 8000);

            // Show browser notification if permission granted
            this.showBrowserNotification(this.bulkData.length, filename);

            // Track analytics
            if (window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackToolUsage('qr_generator', 'bulk_generation', {
                    count: this.bulkData.length,
                    duration: duration,
                    fileSize: zipBlob.size
                });
            }

        } catch (error) {
            this.generator.handleError(error, 'Bulk generation failed');
        } finally {
            this.isProcessing = false;
            this.resetGenerateButton();
        }
    }


    /**
     * Reset generate button
     */
    resetGenerateButton() {
        const generateBtn = this.generator.elements.generateBulk;
        if (generateBtn) {
            generateBtn.innerHTML = `
                <i class="fas fa-magic"></i>
                Generate All QR Codes
            `;
        }
    }

    /**
 * Show browser notification for completion
 */
    showBrowserNotification(count, filename) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('QR Generation Complete!', {
                body: `Successfully generated ${count} QR codes. File: ${filename}`,
                icon: '/favicon-32x32.png',
                tag: 'qr-bulk-complete'
            });
        } else if ('Notification' in window && Notification.permission === 'default') {
            // Request permission for future notifications
            Notification.requestPermission();
        }
    }


    /**
 * Format file size for display
 */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  * Update progress display with enhanced info
  */
    updateProgress(percentage, processed, total, status = 'Generating...') {
        const generateBtn = this.generator.elements.generateBulk;
        if (generateBtn) {
            generateBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                ${status} ${percentage}% (${processed}/${total})
            `;
        }

        // Update progress bar if exists
        const progressBar = document.getElementById('bulkProgressBar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
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
     * Get sample CSV templates with better examples
     */
    getSampleCSVTemplates() {
        return {
            urls: `url,label
https://toolshelf.dev,ToolShelf Homepage
https://github.com/toolshelf,ToolShelf GitHub
https://docs.toolshelf.dev,Documentation
https://api.toolshelf.dev,API Endpoint
https://blog.toolshelf.dev,Blog`,

            contacts: `name,phone,email,organization
John Doe,+1-555-0123,john.doe@company.com,Tech Corp Inc
Jane Smith,+1-555-0124,jane.smith@startup.io,Startup Labs
Mike Johnson,+1-555-0125,mike@consulting.biz,Johnson Consulting
Sarah Wilson,+1-555-0126,sarah.w@agency.com,Digital Agency`,

            wifi: `ssid,password,security,hidden
OfficeWiFi,SecurePass123,WPA,false
GuestNetwork,,none,false
ConferenceRoom,Meeting2024,WPA2,false
VIPLounge,VIP@2024!,WPA2,true`,

            sms: `phone,message
+1-555-0123,Thanks for visiting our booth! Check out our website for special offers.
+1-555-0124,Your appointment reminder: Tomorrow at 2 PM. Reply CONFIRM to confirm.
+1-555-0125,Welcome to our service! Text HELP for assistance or STOP to unsubscribe.`,

            email: `email,subject,body
support@company.com,Quick Contact,Hi! I'd like to learn more about your services.
sales@company.com,Product Inquiry,Please send me information about your products.
info@company.com,General Question,I have a question about your company.`,

            mixed: `type,url,label,name,phone,email,ssid,password
url,https://company.com,Company Website,,,,,
contact,,John's Contact,John Doe,+1-555-0123,john@company.com,,
wifi,,,,,OfficeWiFi,SecurePass123
url,https://support.company.com,Support Portal,,,,,`
        };
    }

    /**
         * Download sample CSV with enhanced templates
         */
    downloadSampleCSV(type = 'urls') {
        const templates = this.getSampleCSVTemplates();
        const csvContent = templates[type] || templates.urls;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = `qr-sample-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

        saveAs(blob, filename);
        this.generator.showToast(`📁 Downloaded sample CSV: ${filename}\n\nUse this as a template for your bulk QR generation.`, 'success', 5000);
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