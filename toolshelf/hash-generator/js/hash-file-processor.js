/**
 * ToolShelf Hash File Processor
 * Handles file upload and processing for hash generation
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.HashFileProcessor = class HashFileProcessor {
    constructor(generator) {
        this.generator = generator;
        this.currentFile = null;
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.isProcessing = false;
        this.chunkSize = 1024 * 1024; // 1MB chunks for large files
    }

    /**
     * Initialize file processor
     */
    init() {
        this.setupFileUpload();
        this.setupDragAndDrop();
        console.log('📁 Hash File Processor initialized');
    }

    /**
     * Setup file upload handling
     */
    setupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const removeFileBtn = document.getElementById('removeFile');

        if (fileInput) {
            this.generator.addEventListener(fileInput, 'change', (e) => {
                this.handleFileSelect(e.target.files);
            });
        }

        if (removeFileBtn) {
            this.generator.addEventListener(removeFileBtn, 'click', () => {
                this.removeFile();
            });
        }
    }

    /**
     * Setup drag and drop handling
     */
    setupDragAndDrop() {
        const dropArea = document.getElementById('fileDropArea');

        if (!dropArea) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.generator.addEventListener(dropArea, eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight drop area when dragging over
        ['dragenter', 'dragover'].forEach(eventName => {
            this.generator.addEventListener(dropArea, eventName, () => {
                dropArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.generator.addEventListener(dropArea, eventName, () => {
                dropArea.classList.remove('drag-over');
            });
        });

        // Handle dropped files
        this.generator.addEventListener(dropArea, 'drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelect(files);
        });
    }

    /**
     * Handle file selection (from input or drop)
     */
    async handleFileSelect(files) {
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.generator.showToast(validation.message, 'error');
            return;
        }

        this.currentFile = file;
        this.showFileInfo(file);

        // Auto-generate hash if text input is active
        if (this.generator.currentInputType === 'file') {
            await this.processFile();
        }
    }

    /**
     * Validate uploaded file
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                message: `File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`
            };
        }

        // Check if file is empty
        if (file.size === 0) {
            return {
                valid: false,
                message: 'File is empty'
            };
        }

        return { valid: true };
    }

    /**
     * Show file information and hide upload area
     */
    showFileInfo(file) {
        const fileDropArea = document.getElementById('fileDropArea');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const fileType = document.getElementById('fileType');
        const textInput = document.getElementById('inputText');

        // Hide upload area, show file info
        if (fileDropArea) fileDropArea.style.display = 'none';
        if (fileInfo) fileInfo.style.display = 'block';

        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
        if (fileType) fileType.textContent = file.type || 'Unknown';

        // Show file content in text input (if text file)
        if (file.type.startsWith('text/') || file.size < 10240) { // Show content for text files or small files
            this.showFileContent(file, textInput);
        } else {
            if (textInput) {
                textInput.value = `[Binary file: ${file.name} (${this.formatFileSize(file.size)})]`;
                textInput.disabled = true;
            }
        }
    }

    /**
 * Show file content in text input
 */
    async showFileContent(file, textInput) {
        if (!textInput) return;

        try {
            const text = await this.readFileAsText(file);
            textInput.value = text;
            textInput.disabled = false;
        } catch (error) {
            textInput.value = `[Could not read file content]`;
            textInput.disabled = true;
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
     * Process file for hash generation
     */
    async processFile() {
        if (!this.currentFile || this.isProcessing) return;

        try {
            this.isProcessing = true;
            this.showProgress(0, 'Starting...');

            const algorithm = this.generator.currentAlgorithm;
            const options = this.generator.getHashOptions();

            let hash;

            // For large files, use streaming approach
            if (this.currentFile.size > this.chunkSize) {
                hash = await this.processLargeFile(this.currentFile, algorithm, options);
            } else {
                hash = await this.processSmallFile(this.currentFile, algorithm, options);
            }

            this.hideProgress();
            this.generator.displayHash(hash, algorithm);

            this.generator.showToast(
                `File hash generated: ${algorithm.toUpperCase()}`,
                'success'
            );

            // Track file hash generation
            if (window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackToolUsage('hash_generator', 'file_hash', {
                    algorithm,
                    fileSize: this.currentFile.size,
                    fileType: this.currentFile.type
                });
            }

        } catch (error) {
            this.hideProgress();
            this.generator.handleError(error, 'File hash generation failed');
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process small files (load entirely into memory)
     */
    async processSmallFile(file, algorithm, options) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const uint8Array = new Uint8Array(arrayBuffer);

                    // Convert to text for text-based processing
                    const text = this.arrayBufferToString(arrayBuffer);

                    const hash = await this.generator.operations.generateTextHash(
                        text,
                        algorithm,
                        options
                    );

                    resolve(hash);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Process large files in chunks
     */
    async processLargeFile(file, algorithm, options) {
        // For large files, we need to use streaming hash computation
        // This is a simplified version - in production, use proper streaming crypto

        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('Streaming hash requires Web Crypto API');
        }

        const algorithmInfo = this.generator.operations.getAlgorithmInfo(algorithm);
        if (!algorithmInfo.webCryptoSupported) {
            throw new Error(`Streaming not supported for ${algorithm}`);
        }

        try {
            const totalChunks = Math.ceil(file.size / this.chunkSize);
            let processedChunks = 0;

            // For simplicity, we'll read the entire file
            // In production, implement proper streaming with crypto.subtle
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            const text = this.arrayBufferToString(arrayBuffer);

            // Update progress
            this.showProgress(50, 'Generating hash...');

            const hash = await this.generator.operations.generateTextHash(
                text,
                algorithm,
                options
            );

            this.showProgress(100, 'Complete');
            return hash;

        } catch (error) {
            throw new Error(`Large file processing failed: ${error.message}`);
        }
    }

    /**
     * Read file as ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Convert ArrayBuffer to string (for text-based hash processing)
     */
    arrayBufferToString(buffer) {
        // For binary files, convert to base64 for consistent text representation
        const uint8Array = new Uint8Array(buffer);
        const binary = String.fromCharCode.apply(null, uint8Array);
        return btoa(binary);
    }

    /**
     * Show file processing progress
     */
    showProgress(percentage, status) {
        const progressContainer = document.getElementById('fileProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressContainer) progressContainer.style.display = 'block';
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = status;
    }

    /**
     * Hide file processing progress
     */
    hideProgress() {
        const progressContainer = document.getElementById('fileProgress');
        if (progressContainer) {
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 1000);
        }
    }

    /**
     * Remove current file and restore upload area
     */
    removeFile() {
        this.currentFile = null;

        const fileDropArea = document.getElementById('fileDropArea');
        const fileInfo = document.getElementById('fileInfo');
        const fileInput = document.getElementById('fileInput');
        const textInput = document.getElementById('inputText');

        // Show upload area, hide file info
        if (fileDropArea) fileDropArea.style.display = 'flex';
        if (fileInfo) fileInfo.style.display = 'none';
        if (fileInput) fileInput.value = '';

        // Clear and enable text input
        if (textInput) {
            textInput.value = '';
            textInput.disabled = false;
            textInput.placeholder = 'Enter text to generate hash...';
        }

        // Clear any displayed hash if it was from a file
        if (this.generator.currentInputType === 'file') {
            this.generator.clearHash();
        }

        // this.generator.showToast('File removed', 'success');
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = (bytes / Math.pow(1024, i)).toFixed(2);

        return `${size} ${sizes[i]}`;
    }

    /**
     * Get current file info
     */
    getCurrentFile() {
        return this.currentFile;
    }

    /**
     * Check if file is being processed
     */
    isFileProcessing() {
        return this.isProcessing;
    }

    /**
     * Get supported file types (for display purposes)
     */
    getSupportedFileTypes() {
        return [
            'Text files (.txt, .json, .xml, .csv)',
            'Documents (.pdf, .doc, .docx)',
            'Images (.jpg, .png, .gif, .svg)',
            'Archives (.zip, .tar, .gz)',
            'Executables (.exe, .dmg, .deb)',
            'Any binary file'
        ];
    }

    /**
     * Cleanup
     */
    destroy() {
        this.removeFile();
        this.currentFile = null;
        this.isProcessing = false;
    }
};