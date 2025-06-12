/**
 * ToolShelf Text Transformation Functions
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.TextTransforms = {
    /**
     * Convert text to uppercase
     */
    uppercase(text) {
        return text.toUpperCase();
    },

    /**
     * Convert text to lowercase
     */
    lowercase(text) {
        return text.toLowerCase();
    },

    /**
     * Convert text to title case with smart handling
     */
    titlecase(text) {
        const minorWords = new Set([
            'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in',
            'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with',
            'from', 'into', 'like', 'over', 'such', 'than', 'that', 'this',
            'upon', 'when', 'where', 'who', 'whom', 'why', 'will'
        ]);

        return text.split('\n').map(line => {
            if (!line.trim()) return line;

            return line.split(' ').map((word, index, words) => {
                const cleanWord = word.toLowerCase().trim();
                if (!cleanWord) return word;

                // Always capitalize first and last word, or if not a minor word
                if (index === 0 || index === words.length - 1 || !minorWords.has(cleanWord)) {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                return cleanWord;
            }).join(' ');
        }).join('\n');
    },

    /**
     * Convert text to sentence case
     */
    sentencecase(text) {
        return text
            // Capitalize after sentence endings
            .replace(/([.!?]\s*)([a-z])/g, (match, punct, letter) => {
                return punct + letter.toUpperCase();
            })
            // Capitalize first character
            .replace(/^([a-z])/, (match, letter) => {
                return letter.toUpperCase();
            })
            // Capitalize after line breaks
            .replace(/(\n\s*)([a-z])/g, (match, space, letter) => {
                return space + letter.toUpperCase();
            });
    },

    /**
     * Reverse text character by character
     */
    reverse(text) {
        return text.split('').reverse().join('');
    },

    /**
     * Remove duplicate lines with smart comparison
     */
    removeDuplicates(text) {
        const lines = text.split('\n');
        const seen = new Set();
        const uniqueLines = [];

        for (const line of lines) {
            // Use trimmed lowercase version for comparison
            const normalizedLine = line.trim().toLowerCase();
            if (!seen.has(normalizedLine)) {
                seen.add(normalizedLine);
                uniqueLines.push(line);
            }
        }

        return uniqueLines.join('\n');
    },

    /**
     * Trim whitespace with comprehensive cleaning
     */
    trimWhitespace(text) {
        const lines = text.split('\n');

        // Trim each line
        let trimmedLines = lines.map(line => line.trim());

        // Remove empty lines from start
        while (trimmedLines.length > 0 && trimmedLines[0] === '') {
            trimmedLines.shift();
        }

        // Remove empty lines from end
        while (trimmedLines.length > 0 && trimmedLines[trimmedLines.length - 1] === '') {
            trimmedLines.pop();
        }

        return trimmedLines.join('\n');
    },

    /**
     * Remove empty lines
     */
    removeEmptyLines(text) {
        return text
            .split('\n')
            .filter(line => line.trim() !== '')
            .join('\n');
    },

    /**
     * Sort lines with proper handling of leading whitespace
     */
    sortLines(text, descending = false) {
        const lines = text.split('\n');

        const sorted = lines.sort((a, b) => {
            // Trim for comparison but preserve original formatting
            const aCompare = a.trim().toLowerCase();
            const bCompare = b.trim().toLowerCase();

            // Use locale-aware comparison with numeric support
            const result = aCompare.localeCompare(bCompare, undefined, {
                numeric: true,
                sensitivity: 'base',
                ignorePunctuation: false
            });

            return descending ? -result : result;
        });

        return sorted.join('\n');
    },

    /**
     * Sort lines in descending order
     */
    sortLinesDesc(text) {
        return this.sortLines(text, true);
    },

    /**
     * Reverse the order of lines
     */
    reverseLines(text) {
        return text.split('\n').reverse().join('\n');
    },

    /**
     * Get available transforms
     */
    getAvailableTransforms() {
        return Object.keys(this).filter(key => typeof this[key] === 'function' && key !== 'getAvailableTransforms');
    },

    /**
     * Apply multiple transforms in order
     */
    applyMultiple(text, transforms) {
        let result = text;

        for (const transform of transforms) {
            if (typeof this[transform] === 'function') {
                try {
                    result = this[transform](result);
                } catch (error) {
                    console.error(`❌ Transform failed: ${transform}`, error);
                    // Continue with other transforms
                }
            } else {
                console.warn(`⚠️ Unknown transform: ${transform}`);
            }
        }

        return result;
    },

    /**
     * Validate text before transformation
     */
    validateText(text) {
        const limits = window.ToolShelf.Utils.checkTextLimits(text);

        if (!limits.valid) {
            throw new Error(
                `Text exceeds limits: ${limits.textLength}/${limits.maxTextLength} chars, ` +
                `${limits.lineCount}/${limits.maxLines} lines`
            );
        }

        return true;
    }
};