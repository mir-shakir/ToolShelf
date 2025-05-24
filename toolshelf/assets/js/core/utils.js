/**
 * ToolShelf Utility Functions
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.Utils = {
    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Format numbers with locale-aware formatting
     */
    formatNumber(number) {
        return number.toLocaleString();
    },

    /**
     * Generate timestamp for filenames
     */
    getTimestamp() {
        return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    },

    /**
     * Sanitize filename
     */
    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9.-]/gi, '_');
    },

    /**
     * Check if text exceeds limits
     */
    checkTextLimits(text) {
        const { MAX_TEXT_LENGTH, MAX_LINES } = window.ToolShelf.Constants;
        const lineCount = text.split('\n').length;
        
        return {
            valid: text.length <= MAX_TEXT_LENGTH && lineCount <= MAX_LINES,
            textLength: text.length,
            lineCount: lineCount,
            maxTextLength: MAX_TEXT_LENGTH,
            maxLines: MAX_LINES
        };
    },

    /**
     * Enhanced clipboard functionality
     */
    async copyToClipboard(text) {
        try {
            // Modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } 
            // Fallback for older browsers
            else {
                return this.fallbackCopyToClipboard(text);
            }
        } catch (err) {
            console.error('❌ Clipboard API failed:', err);
            return this.fallbackCopyToClipboard(text);
        }
    },

    /**
     * Fallback clipboard method
     */
    fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '-9999px';
            textArea.setAttribute('readonly', '');
            textArea.setAttribute('aria-hidden', 'true');
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 99999);
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            return successful;
        } catch (err) {
            console.error('❌ Fallback copy failed:', err);
            return false;
        }
    },

    /**
     * Download text as file
     */
    downloadTextFile(content, filename = 'toolshelf-export.txt') {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = this.sanitizeFilename(filename);
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            return true;
        } catch (error) {
            console.error('❌ Download failed:', error);
            return false;
        }
    },

    /**
     * Local storage helpers
     */
    storage: {
        set(key, value) {
            try {
                const prefixedKey = window.ToolShelf.Constants.STORAGE_PREFIX + key;
                localStorage.setItem(prefixedKey, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('Storage not available:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const prefixedKey = window.ToolShelf.Constants.STORAGE_PREFIX + key;
                const item = localStorage.getItem(prefixedKey);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('Storage read failed:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                const prefixedKey = window.ToolShelf.Constants.STORAGE_PREFIX + key;
                localStorage.removeItem(prefixedKey);
                return true;
            } catch (e) {
                console.warn('Storage remove failed:', e);
                return false;
            }
        }
    },

    /**
     * Performance monitoring
     */
    performance: {
        mark(name) {
            if (window.performance && window.performance.mark) {
                performance.mark(name);
            }
        },

        measure(name, startMark, endMark) {
            if (window.performance && window.performance.measure) {
                try {
                    performance.measure(name, startMark, endMark);
                    const measure = performance.getEntriesByName(name)[0];
                    return measure ? measure.duration : 0;
                } catch (e) {
                    return 0;
                }
            }
            return 0;
        }
    },

    /**
     * Error tracking
     */
    trackError(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Store in localStorage for debugging
        try {
            const errors = this.storage.get('errors', []);
            errors.unshift(errorData);
            errors.splice(window.ToolShelf.Constants.MAX_ERRORS_STORED);
            this.storage.set('errors', errors);
        } catch (e) {
            console.warn('Could not store error data:', e);
        }
        
        return errorData;
    }
};