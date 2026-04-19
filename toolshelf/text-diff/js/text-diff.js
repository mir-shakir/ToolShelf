/**
 * ToolShelf Text Diff
 * UI class: binds events, renders side-by-side / unified views, copies/downloads patches.
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.TextDiff = class TextDiff extends window.ToolShelf.BaseTool {
    constructor() {
        super('text-diff');
        this.state = { view: 'side-by-side', ignoreWhitespace: false, ignoreCase: false, trim: false };
        this.lastScript = null;
        this.init();
    }

    init() {
        this.cacheDom();
        if (!this.els.left) return;
        this.bindEvents();
        this.importState();
        this.applyStateToUi();
        this.updatePanelStats();
        super.init();
    }

    cacheDom() {
        this.els = {
            left: document.querySelector('[data-input-area="left"]'),
            right: document.querySelector('[data-input-area="right"]'),
            leftStats: document.querySelector('[data-stats="left"]'),
            rightStats: document.querySelector('[data-stats="right"]'),
            viewRadios: document.querySelectorAll('[data-view]'),
            optIgnoreWs: document.querySelector('[data-option-ignore-whitespace]'),
            optIgnoreCase: document.querySelector('[data-option-ignore-case]'),
            optTrim: document.querySelector('[data-option-trim]'),
            compareBtn: document.querySelector('[data-action="compare"]'),
            swapBtn: document.querySelector('[data-action="swap"]'),
            clearBtn: document.querySelector('[data-action="clear"]'),
            summary: document.querySelector('[data-diff-summary]'),
            output: document.querySelector('[data-diff-output]'),
            exportArea: document.querySelector('[data-diff-export]'),
            copyPatchBtn: document.querySelector('[data-action="copy-patch"]'),
            downloadPatchBtn: document.querySelector('[data-action="download-patch"]')
        };
    }

    bindEvents() {
        [this.els.left, this.els.right].forEach(ta => {
            this.addEventListener(ta, 'input', window.ToolShelf.Utils.debounce(() => this.updatePanelStats(), 100));
        });

        this.els.viewRadios.forEach(r => this.addEventListener(r, 'change', () => {
            if (r.checked) {
                this.state.view = r.value;
                this.exportState();
                if (this.lastScript) this.render(this.lastScript);
                this.emit('view-changed', { view: r.value });
            }
        }));

        [['optIgnoreWs', 'ignoreWhitespace'], ['optIgnoreCase', 'ignoreCase'], ['optTrim', 'trim']].forEach(([el, key]) => {
            this.addEventListener(this.els[el], 'change', (e) => {
                this.state[key] = e.target.checked;
                this.exportState();
            });
        });

        this.addEventListener(this.els.compareBtn, 'click', () => this.runCompare());
        this.addEventListener(this.els.swapBtn, 'click', () => this.swap());
        this.addEventListener(this.els.clearBtn, 'click', () => this.clear());
        this.addEventListener(this.els.copyPatchBtn, 'click', () => this.copyPatch());
        this.addEventListener(this.els.downloadPatchBtn, 'click', () => this.downloadPatch());

        this.addEventListener(document, 'keydown', (e) => {
            const meta = e.ctrlKey || e.metaKey;
            if (meta && e.key === 'Enter') { e.preventDefault(); this.runCompare(); }
            if (meta && e.key.toLowerCase() === 'l') { e.preventDefault(); this.clear(); }
        });
    }

    applyStateToUi() {
        this.els.viewRadios.forEach(r => { r.checked = (r.value === this.state.view); });
        this.els.optIgnoreWs.checked = this.state.ignoreWhitespace;
        this.els.optIgnoreCase.checked = this.state.ignoreCase;
        this.els.optTrim.checked = this.state.trim;
    }

    updatePanelStats() {
        const format = ta => {
            const lines = ta.value === '' ? 0 : ta.value.split('\n').length;
            return `Lines: ${lines.toLocaleString()}   Chars: ${ta.value.length.toLocaleString()}`;
        };
        if (this.els.leftStats) this.els.leftStats.textContent = format(this.els.left);
        if (this.els.rightStats) this.els.rightStats.textContent = format(this.els.right);
    }

    runCompare() {
        const left = this.els.left.value;
        const right = this.els.right.value;
        if (!left && !right) {
            window.ToolShelf.Toast.error('Paste text in both fields to compare.');
            return;
        }
        const leftLines = left === '' ? 0 : left.split('\n').length;
        const rightLines = right === '' ? 0 : right.split('\n').length;
        const MAX_LINES = (window.ToolShelf.Constants && window.ToolShelf.Constants.MAX_LINES) || 100000;
        if (leftLines > MAX_LINES || rightLines > MAX_LINES) {
            window.ToolShelf.Toast.error(`Each side must be under ${MAX_LINES.toLocaleString()} lines.`);
            return;
        }
        const result = window.ToolShelf.DiffEngine.diff(left, right, {
            ignoreWhitespace: this.state.ignoreWhitespace,
            ignoreCase: this.state.ignoreCase,
            trim: this.state.trim
        });
        if (result && result.error === 'inputs-too-large') {
            window.ToolShelf.Toast.error('Inputs too large for line-diff; split and compare sections.');
            return;
        }
        this.lastScript = result;
        this.render(result);
        const counts = this.countEdits(result);
        this.emit('compared', {
            leftLines, rightLines,
            added: counts.insert, removed: counts.delete,
            view: this.state.view,
            optionsHash: `${+this.state.ignoreWhitespace}${+this.state.ignoreCase}${+this.state.trim}`
        });
    }

    countEdits(script) {
        const c = { equal: 0, insert: 0, delete: 0 };
        for (const e of script) c[e.type]++;
        return c;
    }

    render(script) {
        const counts = this.countEdits(script);
        this.els.summary.textContent = `+${counts.insert} added · −${counts.delete} removed · ${counts.equal} unchanged`;
        if (this.state.view === 'unified') {
            this.els.output.innerHTML = this.renderUnified(script);
        } else {
            this.els.output.innerHTML = this.renderSideBySide(script);
        }
        this.els.exportArea.hidden = false;
    }

    renderSideBySide(script) {
        const row = (leftText, rightText, leftNum, rightNum, klass) => `
            <tr class="diff-row ${klass}">
                <td class="diff-cell"><span class="diff-line-num">${leftNum || ''}</span>${this.escape(leftText)}</td>
                <td class="diff-cell"><span class="diff-line-num">${rightNum || ''}</span>${this.escape(rightText)}</td>
            </tr>`;
        let rows = '';
        for (const e of script) {
            if (e.type === 'equal')  rows += row(e.text, e.text, e.leftLine, e.rightLine, 'diff-row--equal');
            if (e.type === 'delete') rows += row(e.text, '', e.leftLine, '', 'diff-row--removed');
            if (e.type === 'insert') rows += row('', e.text, '', e.rightLine, 'diff-row--added');
        }
        return `<table class="diff-table" role="table" aria-label="Side-by-side diff">${rows}</table>`;
    }

    renderUnified(script) {
        const CTX = 3;
        const hunks = this.computeHunks(script, CTX);
        const parts = [];
        for (const h of hunks) {
            parts.push(`<div class="diff-hunk-header">@@ -${h.leftStart},${h.leftCount} +${h.rightStart},${h.rightCount} @@</div>`);
            for (const e of h.entries) {
                if (e.type === 'equal')  parts.push(`<div class="diff-line"> ${this.escape(e.text)}</div>`);
                if (e.type === 'insert') parts.push(`<div class="diff-line diff-line--added">+${this.escape(e.text)}</div>`);
                if (e.type === 'delete') parts.push(`<div class="diff-line diff-line--removed">-${this.escape(e.text)}</div>`);
            }
        }
        return `<div class="diff-unified" role="region" aria-label="Unified diff">${parts.join('')}</div>`;
    }

    computeHunks(script, context) {
        const hunks = [];
        let i = 0;
        while (i < script.length) {
            if (script[i].type === 'equal') { i++; continue; }
            let start = i;
            while (i < script.length && script[i].type !== 'equal') i++;
            let end = i;
            const preStart = Math.max(0, start - context);
            const postEnd = Math.min(script.length, end + context);
            const entries = script.slice(preStart, postEnd);
            const leftLines = entries.filter(e => e.type !== 'insert').map(e => e.leftLine);
            const rightLines = entries.filter(e => e.type !== 'delete').map(e => e.rightLine);
            hunks.push({
                entries,
                leftStart: leftLines[0] || 0,
                leftCount: leftLines.length,
                rightStart: rightLines[0] || 0,
                rightCount: rightLines.length
            });
            i = postEnd;
        }
        return hunks;
    }

    generatePatchText(script) {
        const CTX = 3;
        const hunks = this.computeHunks(script, CTX);
        const lines = [];
        for (const h of hunks) {
            lines.push(`@@ -${h.leftStart},${h.leftCount} +${h.rightStart},${h.rightCount} @@`);
            for (const e of h.entries) {
                if (e.type === 'equal')  lines.push(' ' + e.text);
                if (e.type === 'insert') lines.push('+' + e.text);
                if (e.type === 'delete') lines.push('-' + e.text);
            }
        }
        return lines.join('\n') + '\n';
    }

    escape(s) {
        return (s || '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // --- Actions ---

    swap() {
        const tmp = this.els.left.value;
        this.els.left.value = this.els.right.value;
        this.els.right.value = tmp;
        this.updatePanelStats();
        if (this.lastScript) this.runCompare();
    }

    clear() {
        this.els.left.value = '';
        this.els.right.value = '';
        this.updatePanelStats();
        this.els.output.innerHTML = '';
        this.els.summary.textContent = '';
        this.els.exportArea.hidden = true;
        this.lastScript = null;
    }

    copyPatch() {
        if (!this.lastScript) return;
        const text = this.generatePatchText(this.lastScript);
        if (!navigator.clipboard) {
            window.ToolShelf.Toast.error('Clipboard unavailable — select and copy manually.');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            window.ToolShelf.Toast.success('Patch copied.');
            this.emit('copied', { kind: 'patch' });
        }).catch(() => window.ToolShelf.Toast.error('Copy failed.'));
    }

    downloadPatch() {
        if (!this.lastScript) return;
        const text = this.generatePatchText(this.lastScript);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `toolshelf-diff-${ts}.patch`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.emit('downloaded', {});
    }

    // --- State + events ---

    exportState() {
        try {
            localStorage.setItem('toolshelf_text_diff_state', JSON.stringify({
                view: this.state.view,
                ignoreWhitespace: this.state.ignoreWhitespace,
                ignoreCase: this.state.ignoreCase,
                trim: this.state.trim
            }));
        } catch (_) {}
    }

    importState() {
        try {
            const raw = localStorage.getItem('toolshelf_text_diff_state');
            if (!raw) return;
            const s = JSON.parse(raw);
            Object.assign(this.state, s);
        } catch (_) {}
    }

    emit(action, payload) {
        if (window.ToolShelf.Events && window.ToolShelf.Events.emit) {
            window.ToolShelf.Events.emit(`text-diff:${action}`, payload);
        }
    }
};
