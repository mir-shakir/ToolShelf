/**
 * ToolShelf Mock Data Generator – UI Controller
 *
 * Extends BaseTool. Manages schema builder, format selection,
 * preview, and download interactions.
 */
window.ToolShelf = window.ToolShelf || {};

const Engine = () => window.ToolShelf.MockDataEngine;

window.ToolShelf.MockDataGenerator = class MockDataGenerator extends window.ToolShelf.BaseTool {
    constructor() {
        super('mock-data-generator');

        this.schema = [];
        this.elements = {};
        this.fakerReady = false;
        this.generating = false;

        this.init();
    }

    /* ── Lifecycle ──────────────────────────────────── */

    init() {
        console.log('🧪 Initializing Mock Data Generator...');
        try {
            this.initializeElements();
            this.initializeUI();
            this.loadPreset('user');
            this.loadFakerAsync();
            this.registerKeyboardShortcuts();
            super.init();
            console.log('✅ Mock Data Generator ready');
        } catch (err) {
            console.error('❌ Init failed:', err);
        }
    }

    initializeElements() {
        const ids = [
            'outputFormat', 'sqlTableName', 'sqlTableGroup', 'rowCount',
            'presetSelect', 'previewBtn', 'generateBtn', 'copyPreviewBtn',
            'previewOutput', 'previewInfo', 'schemaRows', 'addFieldBtn',
            'largeRowWarning', 'dismissWarning', 'generationProgress',
            'progressFill', 'progressText',
            // SQL Import modal elements
            'importSqlBtn', 'sqlImportModal', 'sqlImportClose', 'sqlImportInput',
            'sqlImportError', 'sqlImportErrorMsg', 'sqlImportPreview',
            'sqlPreviewTable', 'sqlParsedCount', 'sqlParsedTable',
            'sqlImportParseBtn', 'sqlImportApplyBtn', 'sqlImportCancelBtn'
        ];
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });

        // Validate critical elements
        if (!this.elements.schemaRows || !this.elements.previewOutput) {
            throw new Error('Missing critical DOM elements');
        }
    }

    initializeUI() {
        const el = this.elements;

        // Format selector → toggle SQL table name field
        el.outputFormat?.addEventListener('change', () => this.onFormatChange());

        // Row count → large-row warning
        el.rowCount?.addEventListener('input', () => this.onRowCountChange());

        // Preset selector
        el.presetSelect?.addEventListener('change', () => {
            this.loadPreset(el.presetSelect.value);
        });

        // Buttons
        el.previewBtn?.addEventListener('click', () => this.preview());
        el.generateBtn?.addEventListener('click', () => this.generateAndDownload());
        el.addFieldBtn?.addEventListener('click', () => this.addField());
        el.copyPreviewBtn?.addEventListener('click', () => this.copyPreview());
        el.dismissWarning?.addEventListener('click', () => {
            el.largeRowWarning.style.display = 'none';
        });

        // SQL Import Modal
        this.setupSqlImportModal();
    }

    registerKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Ctrl+g', callback: () => this.generateAndDownload(), description: 'Generate & Download' },
            { key: 'Ctrl+p', callback: () => this.preview(), description: 'Preview' },
            { key: 'Ctrl+Enter', callback: () => this.copyPreview(), description: 'Copy preview' }
        ];
        this.registerShortcuts(shortcuts);
    }

    /* ── Faker Loader (async, non-blocking) ─────────── */

    async loadFakerAsync() {
        try {
            await Engine().loadFaker();
            this.fakerReady = true;
            // Auto-preview once Faker is ready
            this.preview();
        } catch (err) {
            console.warn('Faker not loaded yet, will retry on action');
        }
    }

    async ensureFaker() {
        if (this.fakerReady) return true;
        try {
            this.showToast('Loading data engine...', 'info', 2000);
            await Engine().loadFaker();
            this.fakerReady = true;
            return true;
        } catch (err) {
            this.showToast('Failed to load data engine. Check your internet connection.', 'error');
            return false;
        }
    }

    /* ── Schema Management ──────────────────────────── */

    loadPreset(presetId) {
        const preset = Engine().PRESETS[presetId];
        if (!preset) return;

        // For "custom" preset, don't clear — just mark as custom
        if (presetId === 'custom') return;

        this.schema = preset.map(f => ({ ...f, options: f.options ? { ...f.options } : {} }));
        this.renderSchema();
    }

    getSchemaFromDOM() {
        const rows = this.elements.schemaRows.querySelectorAll('.schema-row');
        const schema = [];
        rows.forEach(row => {
            const name = row.querySelector('.field-name-input')?.value.trim();
            const type = row.querySelector('.field-type-select')?.value;
            if (!name || !type) return;

            const options = {};
            row.querySelectorAll('.option-input').forEach(inp => {
                if (inp.dataset.key && inp.value.trim()) {
                    options[inp.dataset.key] = inp.value.trim();
                }
            });

            schema.push({ name, type, options });
        });
        return schema;
    }

    renderSchema() {
        const container = this.elements.schemaRows;
        container.innerHTML = '';

        if (this.schema.length === 0) {
            container.innerHTML = `
                <div class="schema-empty">
                    <i class="fas fa-table"></i>
                    <p>No fields defined. Click <strong>Add Field</strong> to start.</p>
                </div>`;
            return;
        }

        this.schema.forEach((field, idx) => {
            const row = this.createSchemaRowElement(field, idx);
            container.appendChild(row);
        });
    }

    createSchemaRowElement(field, idx) {
        const row = document.createElement('div');
        row.className = 'schema-row';
        row.dataset.index = idx;

        // Handle (up/down)
        const handle = document.createElement('div');
        handle.className = 'row-handle';

        const upBtn = document.createElement('button');
        upBtn.className = 'row-handle-btn';
        upBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        upBtn.title = 'Move up';
        upBtn.disabled = idx === 0;
        upBtn.addEventListener('click', () => this.moveField(idx, -1));

        const downBtn = document.createElement('button');
        downBtn.className = 'row-handle-btn';
        downBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        downBtn.title = 'Move down';
        downBtn.disabled = idx === this.schema.length - 1;
        downBtn.addEventListener('click', () => this.moveField(idx, 1));

        handle.appendChild(upBtn);
        handle.appendChild(downBtn);

        // Field name input
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'field-name-input';
        nameInput.value = field.name;
        nameInput.placeholder = 'field_name';
        nameInput.addEventListener('change', () => this.syncSchema());

        // Type select
        const typeSelect = document.createElement('select');
        typeSelect.className = 'field-type-select';
        Engine().FIELD_TYPES.forEach(ft => {
            const opt = document.createElement('option');
            opt.value = ft.value;
            opt.textContent = ft.label;
            if (ft.value === field.type) opt.selected = true;
            typeSelect.appendChild(opt);
        });
        typeSelect.addEventListener('change', () => {
            this.syncSchema();
            this.renderSchema(); // Re-render to update options column
        });

        // Options
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'field-options';
        this.renderFieldOptions(optionsDiv, field);

        // Delete button
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'row-actions';
        const delBtn = document.createElement('button');
        delBtn.className = 'row-delete-btn';
        delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        delBtn.title = 'Remove field';
        delBtn.addEventListener('click', () => this.removeField(idx));
        actionsDiv.appendChild(delBtn);

        row.appendChild(handle);
        row.appendChild(nameInput);
        row.appendChild(typeSelect);
        row.appendChild(optionsDiv);
        row.appendChild(actionsDiv);

        return row;
    }

    renderFieldOptions(container, field) {
        container.innerHTML = '';
        const type = field.type;
        const opts = field.options || {};

        if (type === 'integer' || type === 'float') {
            // Min group
            const minGroup = document.createElement('div');
            minGroup.className = 'option-group';
            const minLbl = document.createElement('label');
            minLbl.className = 'option-lbl';
            minLbl.textContent = 'Min';
            const minInput = document.createElement('input');
            minInput.type = 'number';
            minInput.className = 'option-input';
            minInput.dataset.key = 'min';
            minInput.value = opts.min !== undefined ? opts.min : '0';
            minInput.placeholder = '0';
            minInput.title = 'Minimum value';
            minInput.addEventListener('change', () => this.validateAndSync(minInput, 'min'));
            minGroup.appendChild(minLbl);
            minGroup.appendChild(minInput);

            // Separator
            const sep = document.createElement('span');
            sep.className = 'option-separator';
            sep.textContent = '–';

            // Max group
            const maxGroup = document.createElement('div');
            maxGroup.className = 'option-group';
            const maxLbl = document.createElement('label');
            maxLbl.className = 'option-lbl';
            maxLbl.textContent = 'Max';
            const maxInput = document.createElement('input');
            maxInput.type = 'number';
            maxInput.className = 'option-input';
            maxInput.dataset.key = 'max';
            maxInput.value = opts.max !== undefined ? opts.max : '1000';
            maxInput.placeholder = '1000';
            maxInput.title = 'Maximum value';
            maxInput.addEventListener('change', () => this.validateAndSync(maxInput, 'max'));
            maxGroup.appendChild(maxLbl);
            maxGroup.appendChild(maxInput);

            container.appendChild(minGroup);
            container.appendChild(sep);
            container.appendChild(maxGroup);

            if (type === 'float') {
                const decGroup = document.createElement('div');
                decGroup.className = 'option-group dec-group';
                const decLbl = document.createElement('label');
                decLbl.className = 'option-lbl';
                decLbl.textContent = 'Dec';
                const decInput = document.createElement('input');
                decInput.type = 'number';
                decInput.className = 'option-input';
                decInput.dataset.key = 'decimals';
                decInput.value = opts.decimals !== undefined ? opts.decimals : '2';
                decInput.placeholder = '2';
                decInput.title = 'Decimal places (0–10)';
                decInput.min = '0';
                decInput.max = '10';
                decInput.addEventListener('change', () => this.validateAndSync(decInput, 'decimals'));
                decGroup.appendChild(decLbl);
                decGroup.appendChild(decInput);
                container.appendChild(decGroup);
            }
        } else {
            const hint = document.createElement('span');
            hint.className = 'no-options-hint';
            hint.textContent = 'No options';
            container.appendChild(hint);
        }
    }

    validateAndSync(input, key) {
        let val = parseFloat(input.value);

        if (isNaN(val)) {
            input.classList.add('invalid');
            return;
        }

        // Clamp decimals to 0–10
        if (key === 'decimals') {
            if (val < 0) { val = 0; input.value = '0'; }
            if (val > 10) { val = 10; input.value = '10'; }
        }

        // Auto-fix min > max
        if (key === 'min' || key === 'max') {
            const row = input.closest('.schema-row');
            if (row) {
                const minEl = row.querySelector('.option-input[data-key="min"]');
                const maxEl = row.querySelector('.option-input[data-key="max"]');
                if (minEl && maxEl) {
                    const minVal = parseFloat(minEl.value) || 0;
                    const maxVal = parseFloat(maxEl.value) || 0;
                    if (minVal > maxVal) {
                        if (key === 'min') {
                            maxEl.value = String(minVal);
                        } else {
                            minEl.value = String(maxVal);
                        }
                    }
                    minEl.classList.remove('invalid');
                    maxEl.classList.remove('invalid');
                }
            }
        }

        input.classList.remove('invalid');
        this.syncSchema();
    }

    syncSchema() {
        this.schema = this.getSchemaFromDOM();
        // Mark preset as custom if user changed anything
        if (this.elements.presetSelect) {
            this.elements.presetSelect.value = 'custom';
        }
    }

    addField(fieldDef) {
        this.syncSchema();
        const newField = fieldDef || { name: `field_${this.schema.length + 1}`, type: 'sentence', options: {} };
        this.schema.push(newField);
        this.renderSchema();
    }

    removeField(idx) {
        this.syncSchema();
        if (this.schema.length <= 1) {
            this.showToast('Schema must have at least one field', 'warning');
            return;
        }
        this.schema.splice(idx, 1);
        this.renderSchema();
    }

    moveField(idx, direction) {
        this.syncSchema();
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= this.schema.length) return;
        const temp = this.schema[idx];
        this.schema[idx] = this.schema[newIdx];
        this.schema[newIdx] = temp;
        this.renderSchema();
    }

    /* ── Format / Row Count Handlers ────────────────── */

    onFormatChange() {
        const isSql = this.elements.outputFormat.value === 'sql';
        this.elements.sqlTableGroup.style.display = isSql ? 'flex' : 'none';
    }

    onRowCountChange() {
        const count = parseInt(this.elements.rowCount.value) || 0;
        const warning = this.elements.largeRowWarning;
        if (count > 10000) {
            warning.style.display = 'flex';
        } else {
            warning.style.display = 'none';
        }
    }

    /* ── Preview ────────────────────────────────────── */

    async preview() {
        if (!(await this.ensureFaker())) return;

        this.syncSchema();
        if (this.schema.length === 0) {
            this.showToast('Add at least one field to preview', 'warning');
            return;
        }

        const faker = await Engine().loadFaker();
        const previewCount = 10;
        const rows = Engine().generateRows(faker, this.schema, previewCount);
        const format = this.elements.outputFormat.value;
        const tableName = this.elements.sqlTableName?.value || 'data';

        let output;
        switch (format) {
            case 'csv': output = Engine().toCSV(rows, this.schema); break;
            case 'sql': output = Engine().toSQL(rows, this.schema, tableName); break;
            default: output = Engine().toJSON(rows);
        }

        this.elements.previewOutput.value = output;
        this.elements.previewInfo.textContent = `Showing first ${previewCount} rows (${format.toUpperCase()})`;
        this.elements.copyPreviewBtn.disabled = false;
    }

    /* ── Copy Preview ───────────────────────────────── */

    async copyPreview() {
        const text = this.elements.previewOutput.value;
        if (!text) {
            this.showToast('Nothing to copy. Preview first.', 'warning');
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Preview copied to clipboard', 'success');

            if (window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackContentCopied('mock_data_generator');
            }
        } catch (err) {
            this.handleError(err, 'Copy failed');
        }
    }

    /* ── Generate & Download ────────────────────────── */

    async generateAndDownload() {
        if (this.generating) return;
        if (!(await this.ensureFaker())) return;

        this.syncSchema();
        if (this.schema.length === 0) {
            this.showToast('Add at least one field first', 'warning');
            return;
        }

        const count = parseInt(this.elements.rowCount.value) || 100;
        if (count < 1) {
            this.showToast('Row count must be at least 1', 'warning');
            return;
        }
        if (count > 100000) {
            this.elements.rowCount.value = 100000;
            this.showToast('Row count capped at 100,000', 'info');
        }

        const format = this.elements.outputFormat.value;
        const tableName = this.elements.sqlTableName?.value || 'data';
        const finalCount = Math.min(count, 100000);

        this.generating = true;
        this.setGenerating(true);

        try {
            const faker = await Engine().loadFaker();

            const startTime = performance.now();

            const result = await Engine().generateChunked(
                faker, this.schema, finalCount, format, tableName,
                (progress) => this.updateProgress(progress)
            );

            const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);

            // Update preview with first part
            const previewSlice = result.length > 50000 ? result.substring(0, 50000) + '\n\n... (truncated for preview — full data in download)' : result;
            this.elements.previewOutput.value = previewSlice;
            this.elements.previewInfo.textContent = `Generated ${finalCount.toLocaleString()} rows in ${elapsed}s`;
            this.elements.copyPreviewBtn.disabled = false;

            // Trigger download
            this.downloadResult(result, format);

            this.showToast(`Downloaded ${finalCount.toLocaleString()} rows as ${format.toUpperCase()} (${elapsed}s)`, 'success', 4000);

            // Analytics
            if (window.ToolShelf.Analytics) {
                window.ToolShelf.Analytics.trackToolUsage('mock_data_generator', 'generate', {
                    count: finalCount,
                    format: format
                });
            }

        } catch (err) {
            this.handleError(err, 'Generation failed');
        } finally {
            this.generating = false;
            this.setGenerating(false);
        }
    }

    downloadResult(content, format) {
        const extensions = { json: 'json', csv: 'csv', sql: 'sql' };
        const mimeTypes = { json: 'application/json', csv: 'text/csv', sql: 'text/plain' };
        const ext = extensions[format] || 'txt';
        const mime = mimeTypes[format] || 'text/plain';
        const filename = `mock-data-${Date.now()}.${ext}`;

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (window.ToolShelf.Analytics) {
            window.ToolShelf.Analytics.trackToolUsage('mock_data_generator', 'download');
        }
    }

    /* ── Progress UI ────────────────────────────────── */

    setGenerating(active) {
        const el = this.elements;
        el.generateBtn.disabled = active;
        el.previewBtn.disabled = active;
        el.generationProgress.style.display = active ? 'flex' : 'none';

        if (active) {
            el.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Generating...</span>';
        } else {
            el.generateBtn.innerHTML = '<i class="fas fa-download"></i> <span class="btn-text">Generate & Download</span>';
            el.progressFill.style.width = '0%';
        }
    }

    updateProgress(fraction) {
        const pct = Math.round(fraction * 100);
        this.elements.progressFill.style.width = pct + '%';
        this.elements.progressText.textContent = `${pct}% complete`;
    }

    /* ── Cleanup ────────────────────────────────────── */

    destroy() {
        super.destroy();
    }

    /* ── SQL Import Modal ──────────────────────────── */

    setupSqlImportModal() {
        const el = this.elements;

        el.importSqlBtn?.addEventListener('click', () => this.openSqlImportModal());
        el.sqlImportClose?.addEventListener('click', () => this.closeSqlImportModal());
        el.sqlImportCancelBtn?.addEventListener('click', () => this.closeSqlImportModal());
        el.sqlImportParseBtn?.addEventListener('click', () => this.parseSqlImport());
        el.sqlImportApplyBtn?.addEventListener('click', () => this.applySqlImport());

        // Close on backdrop click
        el.sqlImportModal?.querySelector('.sql-import-backdrop')?.addEventListener('click', () => {
            this.closeSqlImportModal();
        });

        // Close on Escape
        el.sqlImportModal?.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeSqlImportModal();
        });

        // Store parsed result
        this._sqlParseResult = null;
    }

    openSqlImportModal() {
        const el = this.elements;
        el.sqlImportModal.classList.add('open');
        el.sqlImportModal.setAttribute('aria-hidden', 'false');
        el.sqlImportInput.value = '';
        el.sqlImportError.style.display = 'none';
        el.sqlImportPreview.style.display = 'none';
        el.sqlImportApplyBtn.disabled = true;
        this._sqlParseResult = null;

        // Focus textarea
        setTimeout(() => el.sqlImportInput.focus(), 100);

        // Track analytics
        if (window.ToolShelf.Analytics) {
            window.ToolShelf.Analytics.trackToolUsage('mock_data_generator', 'sql_import_open');
        }
    }

    closeSqlImportModal() {
        const el = this.elements;
        el.sqlImportModal.classList.remove('open');
        el.sqlImportModal.setAttribute('aria-hidden', 'true');
    }

    parseSqlImport() {
        const el = this.elements;
        const sql = el.sqlImportInput.value.trim();

        if (!sql) {
            this.showSqlImportError('Please paste a SQL CREATE TABLE statement or column definitions.');
            return;
        }

        // Parse using the SQL parser
        const result = window.ToolShelf.SQLSchemaParser.parse(sql);

        if (result.errors.length > 0) {
            this.showSqlImportError(result.errors.join(' '));
            el.sqlImportPreview.style.display = 'none';
            el.sqlImportApplyBtn.disabled = true;
            this._sqlParseResult = null;
            return;
        }

        // Success — show preview
        this._sqlParseResult = result;
        el.sqlImportError.style.display = 'none';
        el.sqlParsedCount.textContent = result.fields.length;
        el.sqlParsedTable.textContent = result.tableName;

        // Render preview table
        this.renderSqlPreviewTable(result.fields);
        el.sqlImportPreview.style.display = 'block';
        el.sqlImportApplyBtn.disabled = false;

        // Track
        if (window.ToolShelf.Analytics) {
            window.ToolShelf.Analytics.trackToolUsage('mock_data_generator', 'sql_import_parse', {
                columns: result.fields.length
            });
        }
    }

    showSqlImportError(msg) {
        const el = this.elements;
        el.sqlImportErrorMsg.textContent = msg;
        el.sqlImportError.style.display = 'flex';
    }

    renderSqlPreviewTable(fields) {
        const container = this.elements.sqlPreviewTable;
        let html = `
            <table class="sql-preview-mapping">
                <thead>
                    <tr>
                        <th>Column</th>
                        <th>SQL Type</th>
                        <th>→</th>
                        <th>Faker Type</th>
                    </tr>
                </thead>
                <tbody>`;

        const fakerLabels = {};
        Engine().FIELD_TYPES.forEach(ft => { fakerLabels[ft.value] = ft.label; });

        for (const field of fields) {
            html += `
                    <tr>
                        <td><code>${this.escapeHtml(field.name)}</code></td>
                        <td><span class="sql-type-badge">${this.escapeHtml(field.sqlType)}</span></td>
                        <td class="arrow-col">→</td>
                        <td><span class="faker-type-badge">${fakerLabels[field.type] || field.type}</span></td>
                    </tr>`;
        }

        html += `
                </tbody>
            </table>`;

        container.innerHTML = html;
    }

    applySqlImport() {
        if (!this._sqlParseResult || this._sqlParseResult.fields.length === 0) return;

        const result = this._sqlParseResult;

        // Apply parsed schema
        this.schema = result.fields.map(f => ({
            name: f.name,
            type: f.type,
            options: f.options || {}
        }));

        // Update table name if SQL format is selected
        if (result.tableName && this.elements.sqlTableName) {
            this.elements.sqlTableName.value = result.tableName;
        }

        // Mark preset as custom
        if (this.elements.presetSelect) {
            this.elements.presetSelect.value = 'custom';
        }

        this.renderSchema();
        this.closeSqlImportModal();

        this.showToast(`Imported ${result.fields.length} columns from "${result.tableName}"`, 'success', 3000);

        // Auto-preview if Faker is ready
        if (this.fakerReady) {
            setTimeout(() => this.preview(), 200);
        }

        // Track
        if (window.ToolShelf.Analytics) {
            window.ToolShelf.Analytics.trackToolUsage('mock_data_generator', 'sql_import_apply', {
                columns: result.fields.length,
                table: result.tableName
            });
        }
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
