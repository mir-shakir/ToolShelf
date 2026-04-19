/**
 * ToolShelf Epoch Converter
 * Two-way Unix timestamp <-> human-readable date converter with timezone support.
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.EpochConverter = class EpochConverter extends window.ToolShelf.BaseTool {
    constructor() {
        super('epoch-converter');
        this.state = { leftUnit: 's', rightUnit: 's', leftTz: '', rightTz: '' };
        this.relativeTimer = null;
        this.lastLeftDate = null;
        this.init();
    }

    init() {
        this.cacheDom();
        if (!this.els.leftInput) return;
        this.populateTimezones();
        this.bindEvents();
        this.importState();
        this.setDefaultTimezonesIfEmpty();
        this.startRelativeTimer();
        super.init();
    }

    cacheDom() {
        this.els = {
            leftInput: document.querySelector('[data-epoch-input]'),
            leftUnit: document.querySelectorAll('[data-epoch-unit]'),
            leftTz: document.querySelector('[data-epoch-tz]'),
            leftError: document.querySelector('[data-epoch-error]'),
            leftOutputs: {
                utc: document.querySelector('[data-epoch-utc]'),
                local: document.querySelector('[data-epoch-local]'),
                iso: document.querySelector('[data-epoch-iso]'),
                rfc: document.querySelector('[data-epoch-rfc]'),
                relative: document.querySelector('[data-epoch-relative]')
            },
            copyAllBtn: document.querySelector('[data-epoch-copy-all]'),

            rightDate: document.querySelector('[data-date-input-date]'),
            rightTime: document.querySelector('[data-date-input-time]'),
            rightUnit: document.querySelectorAll('[data-date-unit]'),
            rightTz: document.querySelector('[data-date-tz]'),
            rightError: document.querySelector('[data-date-error]'),
            rightOutputs: {
                epoch: document.querySelector('[data-date-epoch]'),
                iso: document.querySelector('[data-date-iso]'),
                rfc: document.querySelector('[data-date-rfc]')
            },

            presetButtons: document.querySelectorAll('[data-epoch-preset]'),
            copyButtons: document.querySelectorAll('[data-copy-target]')
        };
    }

    populateTimezones() {
        const zones = (typeof Intl.supportedValuesOf === 'function')
            ? Intl.supportedValuesOf('timeZone')
            : ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const ordered = ['UTC', browserTz, ...zones.filter(z => z !== 'UTC' && z !== browserTz)];
        [this.els.leftTz, this.els.rightTz].forEach(sel => {
            if (!sel) return;
            sel.innerHTML = ordered.map(z => `<option value="${z}">${z}</option>`).join('');
        });
    }

    setDefaultTimezonesIfEmpty() {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!this.state.leftTz) { this.state.leftTz = browserTz; this.els.leftTz.value = browserTz; }
        if (!this.state.rightTz) { this.state.rightTz = browserTz; this.els.rightTz.value = browserTz; }
    }

    bindEvents() {
        const debouncedLeft = window.ToolShelf.Utils.debounce(() => this.runLeft(), 100);
        const debouncedRight = window.ToolShelf.Utils.debounce(() => this.runRight(), 100);

        this.addEventListener(this.els.leftInput, 'input', (e) => {
            this.autoDetectUnit(e.target.value);
            debouncedLeft();
        });
        this.els.leftUnit.forEach(r => this.addEventListener(r, 'change', () => {
            this.state.leftUnit = this.getSelectedUnit(this.els.leftUnit);
            this.exportState();
            this.runLeft();
        }));
        this.addEventListener(this.els.leftTz, 'change', (e) => {
            this.state.leftTz = e.target.value;
            this.exportState();
            this.runLeft();
            this.emit('timezone-changed', { timezone: e.target.value, panel: 'left' });
        });

        this.addEventListener(this.els.rightDate, 'input', debouncedRight);
        this.addEventListener(this.els.rightTime, 'input', debouncedRight);
        this.els.rightUnit.forEach(r => this.addEventListener(r, 'change', () => {
            this.state.rightUnit = this.getSelectedUnit(this.els.rightUnit);
            this.exportState();
            this.runRight();
        }));
        this.addEventListener(this.els.rightTz, 'change', (e) => {
            this.state.rightTz = e.target.value;
            this.exportState();
            this.runRight();
            this.emit('timezone-changed', { timezone: e.target.value, panel: 'right' });
        });

        this.els.presetButtons.forEach(btn => this.addEventListener(btn, 'click', () => {
            const preset = btn.getAttribute('data-epoch-preset');
            this.applyPreset(preset);
            this.emit('preset-clicked', { preset });
        }));

        this.els.copyButtons.forEach(btn => this.addEventListener(btn, 'click', () => {
            const target = btn.getAttribute('data-copy-target');
            const el = document.querySelector(target);
            if (el) this.copyToClipboard(el.textContent, target);
        }));

        if (this.els.copyAllBtn) {
            this.addEventListener(this.els.copyAllBtn, 'click', () => this.copyAll());
        }

        this.addEventListener(document, 'keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
                e.preventDefault();
                this.clear();
            }
        });
    }

    getSelectedUnit(radioList) {
        for (const r of radioList) if (r.checked) return r.value;
        return 's';
    }

    autoDetectUnit(value) {
        const clean = (value || '').replace(/^-/, '').trim();
        if (!/^\d+$/.test(clean)) return;
        let unit = 's';
        if (clean.length >= 16) unit = 'us';
        else if (clean.length >= 13) unit = 'ms';
        this.els.leftUnit.forEach(r => { r.checked = (r.value === unit); });
        this.state.leftUnit = unit;
    }

    // --- Epoch → Date ---

    runLeft() {
        const raw = this.els.leftInput.value.trim();
        this.els.leftError.textContent = '';
        if (!raw) { this.clearLeftOutputs(); this.lastLeftDate = null; return; }
        const n = Number(raw);
        if (!Number.isFinite(n)) {
            this.els.leftError.textContent = 'Enter a numeric timestamp.';
            this.clearLeftOutputs(); return;
        }
        const ms = this.toMilliseconds(n, this.state.leftUnit);
        const date = new Date(ms);
        if (isNaN(date.getTime())) {
            this.els.leftError.textContent = 'Timestamp out of range.';
            this.clearLeftOutputs(); return;
        }
        this.lastLeftDate = date;
        const fmt = this.formatInTz(date, this.state.leftTz);
        this.els.leftOutputs.utc.textContent = this.formatInTz(date, 'UTC').pretty;
        this.els.leftOutputs.local.textContent = fmt.pretty;
        this.els.leftOutputs.iso.textContent = date.toISOString();
        this.els.leftOutputs.rfc.textContent = this.formatRfc3339(date, this.state.leftTz);
        this.els.leftOutputs.relative.textContent = this.formatRelative(date);
        this.emit('converted', { direction: 'epoch-to-date', unit: this.state.leftUnit });
    }

    clearLeftOutputs() {
        Object.values(this.els.leftOutputs).forEach(el => { if (el) el.textContent = ''; });
    }

    // --- Date → Epoch ---

    runRight() {
        const dateStr = this.els.rightDate.value;
        const timeStr = this.els.rightTime.value || '00:00:00';
        this.els.rightError.textContent = '';
        if (!dateStr) { this.clearRightOutputs(); return; }
        const date = this.parseDateInTz(dateStr, timeStr, this.state.rightTz);
        if (!date || isNaN(date.getTime())) {
            this.els.rightError.textContent = 'Invalid date or time.';
            this.clearRightOutputs(); return;
        }
        const ms = date.getTime();
        const epoch = this.state.rightUnit === 'ms' ? ms : Math.floor(ms / 1000);
        this.els.rightOutputs.epoch.textContent = String(epoch);
        this.els.rightOutputs.iso.textContent = date.toISOString();
        this.els.rightOutputs.rfc.textContent = this.formatRfc3339(date, this.state.rightTz);
        this.emit('converted', { direction: 'date-to-epoch', unit: this.state.rightUnit });
    }

    clearRightOutputs() {
        Object.values(this.els.rightOutputs).forEach(el => { if (el) el.textContent = ''; });
    }

    parseDateInTz(dateStr, timeStr, tz) {
        const [y, mo, d] = dateStr.split('-').map(Number);
        const [h, mi, s = 0] = timeStr.split(':').map(Number);
        const asUtc = Date.UTC(y, mo - 1, d, h, mi, s);
        const offsetMs = this.getTzOffsetMs(new Date(asUtc), tz);
        return new Date(asUtc - offsetMs);
    }

    getTzOffsetMs(date, tz) {
        const dtf = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, hour12: false,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const parts = dtf.formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
        const asIfUtc = Date.UTC(
            Number(parts.year), Number(parts.month) - 1, Number(parts.day),
            Number(parts.hour === '24' ? '00' : parts.hour),
            Number(parts.minute), Number(parts.second)
        );
        return asIfUtc - date.getTime();
    }

    toMilliseconds(n, unit) {
        if (unit === 'ms') return n;
        if (unit === 'us') return n / 1000;
        return n * 1000;
    }

    formatInTz(date, tz) {
        const dtf = new Intl.DateTimeFormat('en-GB', {
            timeZone: tz, hour12: false,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZoneName: 'short'
        });
        const pretty = dtf.format(date).replace(',', '');
        return { pretty };
    }

    formatRfc3339(date, tz) {
        const offsetMs = this.getTzOffsetMs(date, tz);
        const sign = offsetMs >= 0 ? '+' : '-';
        const abs = Math.abs(offsetMs);
        const hh = String(Math.floor(abs / 3_600_000)).padStart(2, '0');
        const mm = String(Math.floor((abs % 3_600_000) / 60_000)).padStart(2, '0');
        const dtf = new Intl.DateTimeFormat('sv-SE', {
            timeZone: tz, hour12: false,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const local = dtf.format(date).replace(' ', 'T');
        return `${local}${sign}${hh}:${mm}`;
    }

    formatRelative(date) {
        const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
        const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
        const abs = Math.abs(diffSec);
        const units = [
            { limit: 60, unit: 'second', div: 1 },
            { limit: 3600, unit: 'minute', div: 60 },
            { limit: 86400, unit: 'hour', div: 3600 },
            { limit: 2_592_000, unit: 'day', div: 86400 },
            { limit: 31_536_000, unit: 'month', div: 2_592_000 },
            { limit: Infinity, unit: 'year', div: 31_536_000 }
        ];
        for (const u of units) {
            if (abs < u.limit) return rtf.format(Math.round(diffSec / u.div), u.unit);
        }
        return '';
    }

    // --- Presets ---

    applyPreset(preset) {
        const now = new Date();
        let target;
        switch (preset) {
            case 'now': target = now; break;
            case 'start-of-today':
                target = new Date(now); target.setHours(0, 0, 0, 0); break;
            case 'start-of-hour':
                target = new Date(now); target.setMinutes(0, 0, 0); break;
            case 'start-of-month':
                target = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); break;
            case 'start-of-year':
                target = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0); break;
            case '-1h': target = new Date(now.getTime() - 3_600_000); break;
            case '-24h': target = new Date(now.getTime() - 86_400_000); break;
            case '-7d': target = new Date(now.getTime() - 7 * 86_400_000); break;
            default: return;
        }
        const unit = this.state.leftUnit;
        const val = unit === 'ms' ? target.getTime()
                  : unit === 'us' ? target.getTime() * 1000
                  : Math.floor(target.getTime() / 1000);
        this.els.leftInput.value = String(val);
        this.runLeft();
    }

    // --- Relative-time ticker (visibility-aware) ---

    startRelativeTimer() {
        const tick = () => {
            if (document.visibilityState !== 'visible') return;
            if (!this.lastLeftDate) return;
            if (this.els.leftOutputs.relative) {
                this.els.leftOutputs.relative.textContent = this.formatRelative(this.lastLeftDate);
            }
        };
        this.relativeTimer = setInterval(tick, 1000);
    }

    // --- Copy ---

    copyToClipboard(text, fieldName) {
        if (!navigator.clipboard) {
            window.ToolShelf.Toast.error('Clipboard unavailable — select and copy manually.');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            window.ToolShelf.Toast.success('Copied!');
            this.emit('copied', { field: fieldName });
        }).catch(() => {
            window.ToolShelf.Toast.error('Copy failed — select and copy manually.');
        });
    }

    copyAll() {
        const o = this.els.leftOutputs;
        const block =
            `UTC:      ${o.utc.textContent}\n` +
            `Local:    ${o.local.textContent}\n` +
            `ISO:      ${o.iso.textContent}\n` +
            `RFC 3339: ${o.rfc.textContent}\n` +
            `Relative: ${o.relative.textContent}`;
        this.copyToClipboard(block, 'all');
    }

    clear() {
        this.els.leftInput.value = '';
        this.els.rightDate.value = '';
        this.els.rightTime.value = '';
        this.clearLeftOutputs();
        this.clearRightOutputs();
        this.els.leftError.textContent = '';
        this.els.rightError.textContent = '';
    }

    // --- State + events ---

    exportState() {
        try {
            localStorage.setItem(
                'toolshelf_epoch_converter_state',
                JSON.stringify({ leftUnit: this.state.leftUnit, rightUnit: this.state.rightUnit, leftTz: this.state.leftTz, rightTz: this.state.rightTz })
            );
        } catch (_) { /* localStorage may be unavailable */ }
    }

    importState() {
        try {
            const raw = localStorage.getItem('toolshelf_epoch_converter_state');
            if (!raw) return;
            const s = JSON.parse(raw);
            if (s.leftUnit) { this.state.leftUnit = s.leftUnit; this.els.leftUnit.forEach(r => r.checked = (r.value === s.leftUnit)); }
            if (s.rightUnit) { this.state.rightUnit = s.rightUnit; this.els.rightUnit.forEach(r => r.checked = (r.value === s.rightUnit)); }
            if (s.leftTz) { this.state.leftTz = s.leftTz; this.els.leftTz.value = s.leftTz; }
            if (s.rightTz) { this.state.rightTz = s.rightTz; this.els.rightTz.value = s.rightTz; }
        } catch (_) { /* ignore corrupt state */ }
    }

    emit(action, payload) {
        if (window.ToolShelf.Events && window.ToolShelf.Events.emit) {
            window.ToolShelf.Events.emit(`epoch-converter:${action}`, payload);
        }
    }
};
