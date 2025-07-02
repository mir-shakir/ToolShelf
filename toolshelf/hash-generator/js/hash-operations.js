/**
 * ToolShelf Hash Operations - SECURE IMPLEMENTATION
 * Only generates correct hashes or fails gracefully
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.HashOperations = class HashOperations {
    constructor(generator) {
        this.generator = generator;
        this.supportedAlgorithms = new Map();
        this.currentHash = null;
        this.isProcessing = false;
        this.librariesLoaded = {
            cryptojs: false,
            sha3: false,
            blake2b: false
        };
        this.libraryLoadPromise = null;

        this.initializeAlgorithms();
        this.libraryLoadPromise = this.loadCryptoLibraries();
    }

    /**
     * Load crypto libraries with proper error handling
     */
    async loadCryptoLibraries() {
        try {
            console.log('🔄 Loading crypto libraries...');

            // Load crypto-js
            try {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js');
                if (window.CryptoJS) {
                    this.librariesLoaded.cryptojs = true;
                    console.log('✅ CryptoJS loaded successfully');
                } else {
                    console.warn('❌ CryptoJS failed to load properly');
                }
            } catch (error) {
                console.warn('❌ Failed to load CryptoJS:', error);
            }

            // Load SHA3 library
            try {
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/js-sha3/0.8.0/sha3.min.js');
                if (window.sha3_256 && window.sha3_512) {
                    this.librariesLoaded.sha3 = true;
                    console.log('✅ SHA3 library loaded successfully');
                } else {
                    console.warn('❌ SHA3 library failed to load properly');
                }
            } catch (error) {
                console.warn('❌ Failed to load SHA3 library:', error);
            }

            // Load BLAKE2 library (different approach)
            try {
                // await this.loadScript('https://cdn.jsdelivr.net/npm/blake2b@2.1.4/blake2b.min.js');
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/blakejs/1.1.0/blake2b.min.js');
                if (window.blake2b) {
                    this.librariesLoaded.blake2b = true;
                    console.log('✅ BLAKE2b library loaded successfully');
                } else {
                    console.warn('❌ BLAKE2b library failed to load properly');
                }
            } catch (error) {
                console.warn('❌ Failed to load BLAKE2b library:', error);
            }

            // Report status
            const loadedCount = Object.values(this.librariesLoaded).filter(Boolean).length;
            console.log(`📊 Library status: ${loadedCount}/3 libraries loaded successfully`);

            if (loadedCount > 0) {
                this.generator.showToast(`${loadedCount}/3 crypto libraries loaded successfully`, 'success', 3000);
            } else {
                this.generator.showToast('Warning: External crypto libraries failed to load. Only basic algorithms available.', 'warning', 5000);
            }

        } catch (error) {
            console.error('💥 Critical error loading crypto libraries:', error);
            this.generator.showToast('Error loading crypto libraries. Some algorithms may not work.', 'error', 5000);
        }
    }

    /**
     * Load external script with timeout
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            // Timeout after 10 seconds
            const timeout = setTimeout(() => {
                script.remove();
                reject(new Error(`Script loading timeout: ${src}`));
            }, 10000);

            script.onload = () => {
                clearTimeout(timeout);
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeout);
                script.remove();
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Initialize supported hash algorithms
     */
    initializeAlgorithms() {
        this.supportedAlgorithms.set('md5', {
            name: 'MD5',
            outputLength: 32,
            security: 'legacy',
            useCase: 'Legacy compatibility only',
            description: 'Cryptographically broken, use only for compatibility',
            webCryptoSupported: false,
            requiresLibrary: 'cryptojs'
        });

        this.supportedAlgorithms.set('sha1', {
            name: 'SHA-1',
            outputLength: 40,
            security: 'low',
            useCase: 'Legacy systems',
            description: 'Deprecated for security applications',
            webCryptoSupported: true,
            webCryptoName: 'SHA-1',
            requiresLibrary: 'cryptojs'
        });

        this.supportedAlgorithms.set('sha256', {
            name: 'SHA-256',
            outputLength: 64,
            security: 'high',
            useCase: 'General purpose',
            description: 'Recommended for most applications',
            webCryptoSupported: true,
            webCryptoName: 'SHA-256',
            requiresLibrary: 'cryptojs'
        });

        this.supportedAlgorithms.set('sha512', {
            name: 'SHA-512',
            outputLength: 128,
            security: 'high',
            useCase: 'High security applications',
            description: 'Maximum security, larger output',
            webCryptoSupported: true,
            webCryptoName: 'SHA-512',
            requiresLibrary: 'cryptojs'
        });

        this.supportedAlgorithms.set('sha3-256', {
            name: 'SHA3-256',
            outputLength: 64,
            security: 'high',
            useCase: 'Modern applications',
            description: 'Modern alternative to SHA-2',
            webCryptoSupported: false,
            requiresLibrary: 'sha3'
        });

        this.supportedAlgorithms.set('sha3-512', {
            name: 'SHA3-512',
            outputLength: 128,
            security: 'high',
            useCase: 'High security modern',
            description: 'Maximum security with modern design',
            webCryptoSupported: false,
            requiresLibrary: 'sha3'
        });

        this.supportedAlgorithms.set('blake2b', {
            name: 'BLAKE2b',
            outputLength: 128,
            security: 'high',
            useCase: 'High performance',
            description: 'Fast and secure alternative',
            webCryptoSupported: false,
            requiresLibrary: 'blake2b'
        });

        console.log('🔐 Hash algorithms initialized');
    }

    /**
     * Generate hash for text input - SECURE VERSION
     */
    async generateTextHash(text, algorithm, options = {}) {
        try {
            this.isProcessing = true;
            const startTime = performance.now();

            const algorithmInfo = this.supportedAlgorithms.get(algorithm);
            if (!algorithmInfo) {
                throw new Error(`Unsupported algorithm: ${algorithm}`);
            }

            // Check if required library is available
            if (algorithmInfo.requiresLibrary && !this.librariesLoaded[algorithmInfo.requiresLibrary]) {
                // Wait for libraries to load if they're still loading
                if (this.libraryLoadPromise) {
                    console.log('⏳ Waiting for crypto libraries to load...');
                    await this.libraryLoadPromise;
                }

                // Check again after waiting
                if (!this.librariesLoaded[algorithmInfo.requiresLibrary]) {
                    console.log(algorithmInfo.name+' requires external library that failed to load. Please refresh the page and try again.');
                    this.generator.showToast(algorithmInfo.name+ ' requires external library that failed to load. Please refresh the page and try again.','error', 5000);
                    //clear output window
                    return "";
                }
            }

            let hash;

            // Use HMAC if enabled
            if (options.hmac && options.hmacKey) {
                hash = await this.generateHMAC(text, options.hmacKey, algorithm, options);
            } else {
                hash = await this.generateStandardHash(text, algorithm);
            }

            const processingTime = performance.now() - startTime;

            this.currentHash = {
                input: text,
                algorithm,
                hash,
                format: options.format || 'hex',
                processingTime,
                timestamp: new Date().toISOString()
            };

            // Format output according to requested format
            const formattedHash = this.formatHash(hash, options.format || 'hex');

            console.log(`🔐 Hash generated: ${algorithm} in ${processingTime.toFixed(2)}ms`);
            return formattedHash;

        } catch (error) {
            // Show user-friendly error message
            const errorMessage = error.message.includes('requires external library')
                ? error.message
                : `Failed to generate ${algorithm.toUpperCase()} hash: ${error.message}`;

            this.generator.showToast(errorMessage, 'error', 5000);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate standard hash - SECURE VERSION
     */
    async generateStandardHash(text, algorithm) {
        const algorithmInfo = this.supportedAlgorithms.get(algorithm);

        // Try Web Crypto API first for supported algorithms (only on HTTPS)
        if (algorithmInfo.webCryptoSupported &&
            window.crypto &&
            window.crypto.subtle &&
            window.isSecureContext) {
            try {
                console.log(`🔒 Using Web Crypto API for ${algorithm}`);
                return await this.generateWebCryptoHash(text, algorithmInfo.webCryptoName);
            } catch (error) {
                console.warn(`Web Crypto failed for ${algorithm}, falling back to library:`, error);
            }
        }

        // Use crypto libraries - ONLY CORRECT IMPLEMENTATIONS
        return await this.generateLibraryHash(text, algorithm);
    }

    /**
     * Generate hash using Web Crypto API
     */
    async generateWebCryptoHash(text, algorithmName) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest(algorithmName, data);
        return new Uint8Array(hashBuffer);
    }

    /**
     * Generate hash using crypto libraries - ONLY CORRECT IMPLEMENTATIONS
     */
    async generateLibraryHash(text, algorithm) {
        switch (algorithm) {
            case 'md5':
                if (!window.CryptoJS) {
                    throw new Error('MD5 requires CryptoJS library');
                }
                return window.CryptoJS.MD5(text).toString();

            case 'sha1':
                if (!window.CryptoJS) {
                    throw new Error('SHA1 requires CryptoJS library');
                }
                return window.CryptoJS.SHA1(text).toString();

            case 'sha256':
                if (!window.CryptoJS) {
                    throw new Error('SHA256 requires CryptoJS library');
                }
                return window.CryptoJS.SHA256(text).toString();

            case 'sha512':
                if (!window.CryptoJS) {
                    throw new Error('SHA512 requires CryptoJS library');
                }
                return window.CryptoJS.SHA512(text).toString();

            case 'sha3-256':
                if (!window.sha3_256) {
                    throw new Error('SHA3-256 requires js-sha3 library');
                }
                return window.sha3_256(text);

            case 'sha3-512':
                if (!window.sha3_512) {
                    throw new Error('SHA3-512 requires js-sha3 library');
                }
                return window.sha3_512(text);

            case 'blake2b':
                if (!window.blake2b) {
                    throw new Error('BLAKE2b requires blake2b library');
                }
                try {
                    // Try different BLAKE2b library interfaces
                    if (typeof window.blake2b === 'function') {
                        const hash = window.blake2b(64); // 64 bytes output
                        hash.update(new TextEncoder().encode(text));
                        const digest = hash.digest();
                        return Array.from(digest).map(b => b.toString(16).padStart(2, '0')).join('');
                    } else if (window.blake2b.blake2b) {
                        return window.blake2b.blake2b(text, null, 64);
                    } else {
                        throw new Error('BLAKE2b library interface not recognized');
                    }
                } catch (error) {
                    throw new Error(`BLAKE2b generation failed: ${error.message}`);
                }

            default:
                throw new Error(`No secure implementation available for ${algorithm}`);
        }
    }

    /**
     * Generate HMAC hash - SECURE VERSION
     */
    async generateHMAC(text, key, algorithm, options = {}) {
        // Try Web Crypto API first
        if (window.crypto && window.crypto.subtle && window.isSecureContext) {
            const algorithmInfo = this.supportedAlgorithms.get(algorithm);
            if (algorithmInfo.webCryptoSupported) {
                try {
                    console.log(`🔒 Using Web Crypto API for HMAC-${algorithm}`);
                    const keyData = this.prepareHMACKey(key, options.keyEncoding || 'utf8');

                    const cryptoKey = await crypto.subtle.importKey(
                        'raw',
                        keyData,
                        { name: 'HMAC', hash: algorithmInfo.webCryptoName },
                        false,
                        ['sign']
                    );

                    const encoder = new TextEncoder();
                    const data = encoder.encode(text);
                    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);

                    return new Uint8Array(signature);
                } catch (error) {
                    console.warn('Web Crypto HMAC failed, trying library fallback:', error);
                }
            }
        }

        // Fallback to CryptoJS HMAC
        if (!window.CryptoJS) {
            throw new Error(`HMAC-${algorithm.toUpperCase()} requires CryptoJS library`);
        }

        let hmacFunction;
        switch (algorithm) {
            case 'sha1':
                hmacFunction = window.CryptoJS.HmacSHA1;
                break;
            case 'sha256':
                hmacFunction = window.CryptoJS.HmacSHA256;
                break;
            case 'sha512':
                hmacFunction = window.CryptoJS.HmacSHA512;
                break;
            default:
                throw new Error(`HMAC not supported for ${algorithm}`);
        }

        return hmacFunction(text, key).toString();
    }

    /**
     * Check if algorithm is currently available
     */
    isAlgorithmAvailable(algorithm) {
        const info = this.supportedAlgorithms.get(algorithm);
        if (!info) return false;

        // Check Web Crypto availability
        if (info.webCryptoSupported &&
            window.crypto &&
            window.crypto.subtle &&
            window.isSecureContext) {
            return true;
        }

        // Check library availability
        if (info.requiresLibrary) {
            return this.librariesLoaded[info.requiresLibrary];
        }

        return false;
    }

    /**
     * Get algorithm availability status
     */
    getAlgorithmStatus(algorithm) {
        const info = this.supportedAlgorithms.get(algorithm);
        if (!info) return { available: false, reason: 'Unknown algorithm' };

        // Check Web Crypto
        if (info.webCryptoSupported &&
            window.crypto &&
            window.crypto.subtle &&
            window.isSecureContext) {
            return { available: true, method: 'Web Crypto API' };
        }

        // Check library
        if (info.requiresLibrary) {
            const libraryLoaded = this.librariesLoaded[info.requiresLibrary];
            return {
                available: libraryLoaded,
                method: libraryLoaded ? `${info.requiresLibrary} library` : 'Library not loaded',
                reason: libraryLoaded ? null : `Requires ${info.requiresLibrary} library`
            };
        }

        return { available: false, reason: 'No implementation available' };
    }

    /**
     * Get library loading status
     */
    getLibraryStatus() {
        return {
            librariesLoaded: this.librariesLoaded,
            webCrypto: !!(window.crypto && window.crypto.subtle),
            secureContext: !!window.isSecureContext,
            availableAlgorithms: this.getSupportedAlgorithms().filter(alg => this.isAlgorithmAvailable(alg))
        };
    }

    /**
     * Prepare HMAC key based on encoding
     */
    prepareHMACKey(key, encoding) {
        switch (encoding) {
            case 'hex':
                return this.hexStringToUint8Array(key);
            case 'base64':
                return this.base64StringToUint8Array(key);
            case 'utf8':
            default:
                return new TextEncoder().encode(key);
        }
    }

    /**
     * Format hash output according to specified format
     */
    formatHash(hashBytes, format) {
        switch (format) {
            case 'hex':
                return this.toHex(hashBytes);
            case 'base64':
                return this.toBase64(hashBytes);
            case 'binary':
                return this.toBinary(hashBytes);
            default:
                return this.toHex(hashBytes);
        }
    }

    /**
     * Convert to hexadecimal string
     */
    toHex(input) {
        if (typeof input === 'string') {
            return input.toLowerCase(); // Already hex from library
        }
        return Array.from(input)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Convert to Base64 string
     */
    toBase64(input) {
        if (typeof input === 'string') {
            // Convert hex string to bytes first
            const bytes = new Uint8Array(input.length / 2);
            for (let i = 0; i < input.length; i += 2) {
                bytes[i / 2] = parseInt(input.substr(i, 2), 16);
            }
            input = bytes;
        }
        const binary = String.fromCharCode.apply(null, input);
        return btoa(binary);
    }

    /**
     * Convert to binary string
     */
    toBinary(input) {
        if (typeof input === 'string') {
            // Convert hex string to bytes first
            const bytes = new Uint8Array(input.length / 2);
            for (let i = 0; i < input.length; i += 2) {
                bytes[i / 2] = parseInt(input.substr(i, 2), 16);
            }
            input = bytes;
        }
        return Array.from(input)
            .map(byte => byte.toString(2).padStart(8, '0'))
            .join(' ');
    }

    /**
     * Convert hex string to Uint8Array
     */
    hexStringToUint8Array(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    /**
     * Convert Base64 string to Uint8Array
     */
    base64StringToUint8Array(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Get algorithm information
     */
    getAlgorithmInfo(algorithm) {
        return this.supportedAlgorithms.get(algorithm);
    }

    /**
     * Get all supported algorithms
     */
    getSupportedAlgorithms() {
        return Array.from(this.supportedAlgorithms.keys());
    }

    /**
     * Compare two hashes
     */
    compareHashes(hash1, hash2) {
        if (!hash1 || !hash2) {
            return { match: false, reason: 'Missing hash values' };
        }

        // Normalize hashes (remove spaces, convert to lowercase)
        const normalized1 = hash1.replace(/\s+/g, '').toLowerCase();
        const normalized2 = hash2.replace(/\s+/g, '').toLowerCase();

        const match = normalized1 === normalized2;

        return {
            match,
            reason: match ? 'Hashes match' : 'Hashes do not match',
            hash1: normalized1,
            hash2: normalized2
        };
    }

    /**
     * Get current hash information
     */
    getCurrentHash() {
        return this.currentHash;
    }

    /**
     * Clear current hash
     */
    clearCurrentHash() {
        this.currentHash = null;
    }

    /**
     * Get processing status
     */
    isCurrentlyProcessing() {
        return this.isProcessing;
    }

    /**
     * Generate hash statistics
     */
    getHashStatistics(input, algorithm) {
        const algorithmInfo = this.supportedAlgorithms.get(algorithm);
        if (!algorithmInfo) return null;

        const status = this.getAlgorithmStatus(algorithm);
        const libraryStatus = this.getLibraryStatus();

        return {
            inputLength: input.length,
            inputBytes: new Blob([input]).size,
            algorithm: algorithmInfo.name,
            outputLength: algorithmInfo.outputLength,
            securityLevel: algorithmInfo.security,
            useCase: algorithmInfo.useCase,
            isAvailable: status.available,
            method: status.method,
            libraryStatus: libraryStatus
        };
    }
};