/**
 * ToolShelf Hash Operations - SECURE IMPLEMENTATION (hash-wasm only)
 * Only generates correct hashes or fails gracefully, using hash-wasm for all algorithms.
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.HashOperations = class HashOperations {
    constructor(generator) {
        this.generator = generator;
        this.supportedAlgorithms = new Map();
        this.currentHash = null;
        this.isProcessing = false;

        this.initializeAlgorithms();
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
            tips: '⚠️ MD5 is fast but broken—use only for quick file checksums, never for security!'
        });

        this.supportedAlgorithms.set('sha1', {
            name: 'SHA-1',
            outputLength: 40,
            security: 'low',
            useCase: 'Legacy systems',
            description: 'Deprecated for security applications',
            tips: 'SHA-1 hashes look longer than MD5, but it’s also considered insecure for new systems. Use for legacy only!'
        });

        this.supportedAlgorithms.set('sha256', {
            name: 'SHA-256',
            outputLength: 64,
            security: 'high',
            useCase: 'General purpose',
            description: 'Recommended for most applications',
            tips: 'SHA-256 is the current industry standard. Perfect for digital signatures, certificates, and blockchain applications.'
        });

        this.supportedAlgorithms.set('sha512', {
            name: 'SHA-512',
            outputLength: 128,
            security: 'high',
            useCase: 'High security applications',
            description: 'Maximum security, larger output',
            tips: 'SHA-512 offers extra-long hashes—great for maximum security, password storage, and future-proofing.'
        });

        this.supportedAlgorithms.set('sha3-256', {
            name: 'SHA3-256',
            outputLength: 64,
            security: 'high',
            useCase: 'Modern applications',
            description: 'Modern alternative to SHA-2',
            tips: 'SHA3-256 is designed to be secure even against quantum computers. Ideal for forward-thinking and research projects.'
        });

        this.supportedAlgorithms.set('sha3-512', {
            name: 'SHA3-512',
            outputLength: 128,
            security: 'high',
            useCase: 'High security modern',
            description: 'Maximum security with modern design',
            tips: 'The “tank” of hashes—SHA3-512 is for when you want the ultimate in modern cryptographic strength.'
        });

        this.supportedAlgorithms.set('blake2b', {
            name: 'BLAKE2b',
            outputLength: 128,
            security: 'high',
            useCase: 'High performance',
            description: 'Fast and secure alternative',
            tips: 'BLAKE2b is super-fast and highly secure—used by popular protocols like Argon2 and IPFS. Perfect for performance-critical apps!'
        });

        console.log('🔐 Hash algorithms initialized (hash-wasm only)');
    }
    
    /**
     * Generate hash for text input - hash-wasm only
     */
    async generateTextHash(text, algorithm, options = {}) {
        try {
            this.isProcessing = true;
            const startTime = performance.now();

            const algorithmInfo = this.supportedAlgorithms.get(algorithm);
            if (!algorithmInfo) {
                throw new Error(`Unsupported algorithm: ${algorithm}`);
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
            const errorMessage = `Failed to generate ${algorithm.toUpperCase()} hash: ${error.message}`;
            this.generator.showToast(errorMessage, 'error', 5000);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate standard hash - hash-wasm only
     */
    async generateStandardHash(text, algorithm) {
        const hashwasmMap = {
            'md5': () => window.hashwasm.createMD5(),
            'sha1': () => window.hashwasm.createSHA1(),
            'sha256': () => window.hashwasm.createSHA256(),
            'sha512': () => window.hashwasm.createSHA512(),
            'sha3-256': () => window.hashwasm.createSHA3(256),
            'sha3-512': () => window.hashwasm.createSHA3(512)
        };

        if (algorithm === 'blake2b') {
            if (!window.hashwasm || !window.hashwasm.blake2b) {
                throw new Error('BLAKE2b requires hash-wasm library');
            }
            return await window.hashwasm.blake2b(text);
        }

        if (hashwasmMap[algorithm]) {
            if (!window.hashwasm) {
                throw new Error(`${algorithm.toUpperCase()} requires hash-wasm library`);
            }
            const hasher = await hashwasmMap[algorithm]();
            hasher.init();
            hasher.update(text);
            return hasher.digest('hex');
        }

        throw new Error(`No hash-wasm implementation available for ${algorithm}`);
    }

    /**
     * Generate HMAC hash using hash-wasm for all supported algorithms
     * BLAKE2b uses native keyed mode
     * Returns hex string
     */
    async generateHMAC(text, key, algorithm, options = {}) {
        // Helper for hashwasm HMAC
        async function hashwasmHMAC(hashFactory, key, message) {
            const hmac = await window.hashwasm.createHMAC(hashFactory(), key);
            hmac.init();
            hmac.update(message);
            return hmac.digest('hex');
        }

        const hashwasmMap = {
            'md5': () => window.hashwasm.createMD5(),
            'sha1': () => window.hashwasm.createSHA1(),
            'sha256': () => window.hashwasm.createSHA256(),
            'sha512': () => window.hashwasm.createSHA512(),
            'sha3-256': () => window.hashwasm.createSHA3(256),
            'sha3-512': () => window.hashwasm.createSHA3(512)
        };

        // BLAKE2b: use native keyed MAC mode
        if (algorithm === 'blake2b') {
            if (!window.hashwasm || !window.hashwasm.blake2b) {
                throw new Error('BLAKE2b requires hash-wasm library');
            }
            try {
                const outLen = 512; // bits (default)
                const keyData = this.prepareHMACKey
                    ? this.prepareHMACKey(key, options.keyEncoding || 'utf8')
                    : key;
                return await window.hashwasm.blake2b(text, outLen, keyData);
            } catch (error) {
                throw new Error(`BLAKE2b keyed hash failed: ${error.message}`);
            }
        }

        // All others via hashwasm HMAC
        if (hashwasmMap[algorithm]) {
            if (!window.hashwasm || !window.hashwasm.createHMAC) {
                throw new Error(`${algorithm.toUpperCase()} HMAC requires hash-wasm library`);
            }
            try {
                return await hashwasmHMAC(hashwasmMap[algorithm], key, text);
            } catch (error) {
                throw new Error(`${algorithm.toUpperCase()} HMAC failed: ${error.message}`);
            }
        }

        throw new Error(`HMAC not supported for ${algorithm}`);
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
        return {
            inputLength: input.length,
            inputBytes: new Blob([input]).size,
            algorithm: algorithmInfo.name,
            outputLength: algorithmInfo.outputLength,
            securityLevel: algorithmInfo.security,
            useCase: algorithmInfo.useCase,
            isAvailable: true,
            method: 'hash-wasm'
        };
    }
};