/**
 * ToolShelf UUID v7 Generator & Decoder
 * Extends BaseTool — pure JS, no external libraries.
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.UUIDTool = class UUIDTool extends window.ToolShelf.BaseTool {
    constructor() {
        super('uuid-v7-generator');

        // State
        this.format = 'standard'; // 'standard' | 'compact' | 'sql'
        this.bulkCount = 1;
        this.lastGenerated = [];

        // DOM refs
        this.elements = {};

        this.init();
    }

    /* ───────── Lifecycle ───────── */

    init() {
        console.log('🆔 Initializing UUID v7 Generator…');

        try {
            this.initializeElements();
            this.initializeUI();
            this.generate();          // generate on page load
            super.init();
            console.log('✅ UUID v7 Generator initialized');
        } catch (error) {
            this.handleError(error, 'Failed to initialize UUID v7 Generator');
        }
    }

    /* ───────── DOM wiring ───────── */

    initializeElements() {
        const ids = [
            'outputText', 'copyOutput', 'downloadOutput',
            'generateBtn', 'decodeBtn', 'decodeInput',
            'decodeResult', 'visualizerContent',
            'bulkCount', 'bulkCountDisplay',
            'uuidCount', 'outputCharCount',
            'resetAll', 'statusIndicator'
        ];

        ids.forEach(id => { this.elements[id] = document.getElementById(id); });

        this.elements.formatOptions = document.querySelectorAll('input[name="uuid-format"]');
        this.elements.bulkPresets   = document.querySelectorAll('.bulk-preset');

        if (!this.elements.outputText) {
            throw new Error('Required DOM elements not found');
        }

        if (window.ToolShelf.HelpModal) {
            window.ToolShelf.HelpModal.init();
        }

        console.log('🎯 UUID DOM elements initialized');
    }

    initializeUI() {
        // Generate button
        this.addEventListener(this.elements.generateBtn, 'click', () => this.generate());

        // Copy / Download
        this.addEventListener(this.elements.copyOutput, 'click', () => this.copyOutput());
        this.addEventListener(this.elements.downloadOutput, 'click', () => this.downloadOutput());

        // Format radios
        this.elements.formatOptions.forEach(opt => {
            this.addEventListener(opt, 'change', () => {
                this.format = opt.value;
                this.renderOutput();
            });
        });

        // Bulk presets
        this.elements.bulkPresets.forEach(btn => {
            this.addEventListener(btn, 'click', () => {
                const count = parseInt(btn.dataset.count, 10);
                this.setBulkCount(count);
                this.generate();
            });
        });

        // Bulk slider
        if (this.elements.bulkCount) {
            this.addEventListener(this.elements.bulkCount, 'input', () => {
                const count = parseInt(this.elements.bulkCount.value, 10);
                this.setBulkCount(count);
            });
            this.addEventListener(this.elements.bulkCount, 'change', () => {
                this.generate();
            });
        }

        // Decode button + enter key
        this.addEventListener(this.elements.decodeBtn, 'click', () => this.decodeFromInput());
        this.addEventListener(this.elements.decodeInput, 'keydown', (e) => {
            if (e.key === 'Enter') this.decodeFromInput();
        });

        // Auto-decode on paste
        this.addEventListener(this.elements.decodeInput, 'paste', () => {
            setTimeout(() => this.decodeFromInput(), 0);
        });

        // Reset
        if (this.elements.resetAll) {
            this.addEventListener(this.elements.resetAll, 'click', () => this.resetAll());
        }

        console.log('🎨 UUID UI handlers initialized');
    }

    /* ───────── UUID v7 generation (RFC 9562) ───────── */

    /**
     * Generate a single UUID v7.
     * Layout: 48-bit ms timestamp | 4-bit version (0111) | 12-bit rand_a | 2-bit variant (10) | 62-bit rand_b
     */
    static generateUUIDv7() {
        const now = Date.now(); // ms since epoch

        // 16 random bytes
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        // Timestamp → first 6 bytes (48 bits, big-endian)
        const ms = now;
        bytes[0] = (ms / 2 ** 40) & 0xff;
        bytes[1] = (ms / 2 ** 32) & 0xff;
        bytes[2] = (ms / 2 ** 24) & 0xff;
        bytes[3] = (ms / 2 ** 16) & 0xff;
        bytes[4] = (ms / 2 ** 8)  & 0xff;
        bytes[5] =  ms             & 0xff;

        // Version 7 → upper nibble of byte 6
        bytes[6] = (bytes[6] & 0x0f) | 0x70;

        // Variant 10 → upper 2 bits of byte 8
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        // Convert to hex string
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20, 32)
        ].join('-');
    }

    /* ───────── Generate action ───────── */

    generate() {
        return this.measurePerformance('generate', () => {
            const count = this.bulkCount;
            this.lastGenerated = [];

            for (let i = 0; i < count; i++) {
                this.lastGenerated.push(UUIDTool.generateUUIDv7());
            }

            this.renderOutput();
            this.visualize(this.lastGenerated[0]);
            this.updateStatus(`Generated ${count} UUID(s)`, 'success');

            // Analytics
            if (window.ToolShelf.Analytics) {
                const action = count > 1 ? 'bulk_generate' : 'generate';
                window.ToolShelf.Analytics.trackToolUsage('uuid_v7', action);
            }
        });
    }

    /* ───────── Output rendering ───────── */

    renderOutput() {
        const uuids = this.lastGenerated;
        let text = '';

        switch (this.format) {
            case 'compact':
                text = uuids.map(u => u.replace(/-/g, '')).join('\n');
                break;
            case 'sql':
                text = uuids.map(u => `'${u}'`).join(',\n');
                break;
            default: // 'standard'
                text = uuids.join('\n');
        }

        this.elements.outputText.value = text;
        this.elements.outputText.rows = Math.min(Math.max(uuids.length + 1, 3), 20);

        // Stats
        if (this.elements.uuidCount) this.elements.uuidCount.textContent = uuids.length;
        if (this.elements.outputCharCount) this.elements.outputCharCount.textContent = text.length;
    }

    /* ───────── Decode ───────── */

    decodeFromInput() {
        const raw = (this.elements.decodeInput.value || '').trim();
        if (!raw) return;

        this.decode(raw);
    }

    decode(input) {
        const container = this.elements.decodeResult;
        if (!container) return;

        // Strip hyphens and validate hex length
        const hex = input.replace(/-/g, '').toLowerCase();
        if (!/^[0-9a-f]{32}$/.test(hex)) {
            container.innerHTML = this.renderDecodeWarning(
                'Invalid UUID',
                'The input does not look like a valid UUID (expected 32 hex characters).'
            );
            return;
        }

        // Detect version (nibble at position 12)
        const versionNibble = parseInt(hex.charAt(12), 16);

        if (versionNibble === 7) {
            // UUID v7 — extract timestamp
            const tsHex = hex.slice(0, 12); // first 48 bits
            const timestamp = parseInt(tsHex, 16);
            const date = new Date(timestamp);

            container.innerHTML = this.renderDecodeSuccess(date, timestamp, 7);
            this.visualize(input);

            if (window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackToolUsage('uuid_v7', 'decode');
            }
        } else if (versionNibble === 4) {
            container.innerHTML = this.renderDecodeWarning(
                'UUID v4 Detected',
                'This looks like a random v4 UUID — no timestamp is embedded. UUID v4 uses 122 random bits and does not encode time.'
            );
            this.visualizeGeneric(input, 4);
        } else {
            container.innerHTML = this.renderDecodeWarning(
                `UUID v${versionNibble} Detected`,
                `This is a version ${versionNibble} UUID. Timestamp decoding is only supported for UUID v7.`
            );
            this.visualizeGeneric(input, versionNibble);
        }
    }

    renderDecodeSuccess(date, timestamp, version) {
        return `
            <div class="decode-success">
                <h4><i class="fas fa-check-circle"></i> UUID v${version} — Timestamp Decoded</h4>
                <p><strong>UTC:</strong> <span class="decoded-timestamp">${date.toUTCString()}</span></p>
                <p><strong>ISO 8601:</strong> <span class="decoded-timestamp">${date.toISOString()}</span></p>
                <p><strong>Local:</strong> <span class="decoded-timestamp">${date.toLocaleString()}</span></p>
                <p><strong>Unix ms:</strong> <span class="decoded-timestamp">${timestamp}</span></p>
            </div>`;
    }

    renderDecodeWarning(title, message) {
        return `
            <div class="decode-warning">
                <h4><i class="fas fa-info-circle"></i> ${title}</h4>
                <p>${message}</p>
            </div>`;
    }

    /* ───────── Visualiser ───────── */

    /**
     * Render color-coded UUID v7 segments:
     *   Chars 0-7   (8 hex)  = timestamp part 1
     *   Char  8     (hyphen)
     *   Chars 9-12  (4 hex)  = timestamp part 2
     *   Char 13     (hyphen)
     *   Char 14     (1 hex)  = version nibble (7)
     *   Chars 15-17 (3 hex)  = rand_a
     *   Char 18     (hyphen)
     *   Char 19     (1 hex)  = variant high nibble
     *   Char 20 (1 hex partial)= variant low + rand_b start
     *   Chars 21-22 (2 hex)  = rand_b
     *   Char 23     (hyphen)
     *   Chars 24-35 (12 hex) = rand_b
     */
    visualize(uuid) {
        const container = this.elements.visualizerContent;
        if (!container) return;

        const clean = uuid.replace(/-/g, '').toLowerCase();
        if (clean.length !== 32) return;

        // Build formatted UUID with standard hyphenation: 8-4-4-4-12
        const formatted = `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20,32)}`;

        // Map each character index (in the no-hyphen string) to a segment type:
        //  0-11  = timestamp (48 bits = 12 hex chars)
        // 12     = version
        // 13-15  = rand_a
        // 16     = variant (high nibble)
        // 17-31  = rand_b
        // (char 16: upper 2 bits are variant, but we colour the whole nibble for clarity)

        const segTypes = [];
        for (let i = 0; i < 32; i++) {
            if (i < 12)      segTypes.push('timestamp');
            else if (i === 12) segTypes.push('version');
            else if (i < 16)  segTypes.push('random');
            else if (i === 16) segTypes.push('variant');
            else               segTypes.push('random');
        }

        // Build HTML walking the formatted string (with hyphens)
        let html = '<div class="uuid-visual">';
        let hexIdx = 0;

        for (const ch of formatted) {
            if (ch === '-') {
                html += '<span class="seg-hyphen">-</span>';
            } else {
                const seg = segTypes[hexIdx];
                html += `<span class="seg-${seg}">${ch}</span>`;
                hexIdx++;
            }
        }
        html += '</div>';

        // Decoded info cards
        const tsHex = clean.slice(0, 12);
        const timestamp = parseInt(tsHex, 16);
        const date = new Date(timestamp);

        html += `
        <div class="uuid-decoded-info">
            <div class="decoded-field">
                <div class="decoded-field-label">Timestamp</div>
                <div class="decoded-field-value">${date.toISOString()}</div>
            </div>
            <div class="decoded-field">
                <div class="decoded-field-label">Version</div>
                <div class="decoded-field-value">7 (time-ordered)</div>
            </div>
            <div class="decoded-field">
                <div class="decoded-field-label">Variant</div>
                <div class="decoded-field-value">RFC 9562 (10xx)</div>
            </div>
        </div>`;

        container.innerHTML = html;
    }

    /** Generic visualisation for non-v7 UUIDs */
    visualizeGeneric(uuid, version) {
        const container = this.elements.visualizerContent;
        if (!container) return;

        const clean = uuid.replace(/-/g, '').toLowerCase();
        if (clean.length !== 32) return;

        const formatted = `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20,32)}`;

        let html = '<div class="uuid-visual">';
        let hexIdx = 0;

        for (const ch of formatted) {
            if (ch === '-') {
                html += '<span class="seg-hyphen">-</span>';
            } else {
                // Only highlight version nibble (index 12) and variant nibble (index 16)
                let cls = 'seg-random';
                if (hexIdx === 12) cls = 'seg-version';
                if (hexIdx === 16) cls = 'seg-variant';
                html += `<span class="${cls}">${ch}</span>`;
                hexIdx++;
            }
        }
        html += '</div>';

        html += `
        <div class="uuid-decoded-info">
            <div class="decoded-field">
                <div class="decoded-field-label">Version</div>
                <div class="decoded-field-value">${version}</div>
            </div>
            <div class="decoded-field">
                <div class="decoded-field-label">Note</div>
                <div class="decoded-field-value">Random UUID — no embedded timestamp</div>
            </div>
        </div>`;

        container.innerHTML = html;
    }

    /* ───────── Helpers ───────── */

    setBulkCount(count) {
        this.bulkCount = Math.max(1, Math.min(50, count));
        if (this.elements.bulkCount) this.elements.bulkCount.value = this.bulkCount;
        if (this.elements.bulkCountDisplay) this.elements.bulkCountDisplay.textContent = this.bulkCount;

        // Highlight active preset
        this.elements.bulkPresets.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === this.bulkCount);
        });
    }

    async copyOutput() {
        const text = this.elements.outputText.value;
        if (!text) return;

        const ok = await window.ToolShelf.Utils.copyToClipboard(text);
        if (ok) {
            this.showToast('Copied to clipboard!', 'success');
            if (window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackEvent('content_copied', { tool: 'uuid_v7' });
            }
        } else {
            this.showToast('Copy failed', 'error');
        }
    }

    downloadOutput() {
        const text = this.elements.outputText.value;
        if (!text) return;
        window.ToolShelf.Utils.downloadTextFile(text, `uuid-v7-${window.ToolShelf.Utils.getTimestamp()}.txt`);
        this.showToast('Downloaded!', 'success');
    }

    resetAll() {
        this.format = 'standard';
        this.setBulkCount(1);
        this.elements.formatOptions.forEach(opt => { opt.checked = opt.value === 'standard'; });
        this.elements.decodeInput.value = '';
        this.elements.decodeResult.innerHTML =
            '<div class="decode-placeholder"><i class="fas fa-info-circle"></i><span>Paste a UUID v7 above to extract its embedded timestamp</span></div>';
        this.generate();
        this.showToast('Reset complete', 'success');
    }

    updateStatus(message, type = 'info') {
        const el = this.elements.statusIndicator;
        if (!el) return;
        el.className = `status-indicator ${type}`;
        el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i><span>${message}</span>`;
    }
};
