/**
 * ToolShelf Mock Data Generator – Core Generation Logic
 *
 * Uses Faker.js (ESM) loaded lazily from CDN.
 * Extends BaseTool for consistent lifecycle management.
 */
window.ToolShelf = window.ToolShelf || {};

/* ── Faker.js Lazy Loader ─────────────────────────────── */
let fakerInstance = null;
let fakerLoading = null;

async function loadFaker() {
    if (fakerInstance) return fakerInstance;
    if (fakerLoading) return fakerLoading;

    fakerLoading = import('https://esm.sh/@faker-js/faker@8.4.1')
        .then(mod => {
            fakerInstance = mod.faker || mod.default?.faker || mod;
            console.log('✅ Faker.js loaded');
            return fakerInstance;
        })
        .catch(err => {
            console.error('❌ Failed to load Faker.js:', err);
            fakerLoading = null;
            throw err;
        });

    return fakerLoading;
}

/* ── Preset Schemas ───────────────────────────────────── */
const PRESETS = {
    user: [
        { name: 'id', type: 'id' },
        { name: 'name', type: 'name' },
        { name: 'email', type: 'email' },
        { name: 'created_at', type: 'date' }
    ],
    product: [
        { name: 'id', type: 'id' },
        { name: 'product_name', type: 'sentence' },
        { name: 'price', type: 'float', options: { min: '1', max: '999', decimals: '2' } },
        { name: 'category', type: 'company' },
        { name: 'in_stock', type: 'boolean' }
    ],
    order: [
        { name: 'order_id', type: 'uuid' },
        { name: 'customer_name', type: 'name' },
        { name: 'email', type: 'email' },
        { name: 'amount', type: 'float', options: { min: '10', max: '5000', decimals: '2' } },
        { name: 'status', type: 'boolean' },
        { name: 'order_date', type: 'date' }
    ],
    company: [
        { name: 'id', type: 'id' },
        { name: 'company_name', type: 'company' },
        { name: 'city', type: 'city' },
        { name: 'country', type: 'country' },
        { name: 'url', type: 'url' },
        { name: 'phone', type: 'phone' }
    ],
    custom: []
};

/* ── Available Field Types ────────────────────────────── */
const FIELD_TYPES = [
    { value: 'id', label: 'ID (Auto-increment)' },
    { value: 'uuid', label: 'UUID' },
    { value: 'name', label: 'Full Name' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'date', label: 'Date (ISO)' },
    { value: 'datetime', label: 'DateTime (ISO)' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'integer', label: 'Integer (Range)' },
    { value: 'float', label: 'Float (Range)' },
    { value: 'city', label: 'City' },
    { value: 'country', label: 'Country' },
    { value: 'address', label: 'Street Address' },
    { value: 'zipCode', label: 'Zip Code' },
    { value: 'company', label: 'Company' },
    { value: 'url', label: 'URL' },
    { value: 'ip', label: 'IPv4 Address' },
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'sentence', label: 'Sentence' },
    { value: 'word', label: 'Single Word' },
    { value: 'color', label: 'Color (Hex)' }
];

/* ── Value Generator ──────────────────────────────────── */
function generateValue(faker, type, rowIndex, options) {
    const opts = options || {};
    switch (type) {
        case 'id':
            return rowIndex + 1;
        case 'uuid':
            return faker.string.uuid();
        case 'name':
            return faker.person.fullName();
        case 'firstName':
            return faker.person.firstName();
        case 'lastName':
            return faker.person.lastName();
        case 'email':
            return faker.internet.email().toLowerCase();
        case 'phone':
            return faker.phone.number();
        case 'date':
            return faker.date.between({ from: '2020-01-01', to: '2026-12-31' }).toISOString().split('T')[0];
        case 'datetime':
            return faker.date.between({ from: '2020-01-01', to: '2026-12-31' }).toISOString();
        case 'boolean':
            return faker.datatype.boolean();
        case 'integer': {
            const min = parseInt(opts.min) || 0;
            const max = parseInt(opts.max) || 1000;
            return faker.number.int({ min, max });
        }
        case 'float': {
            const min = parseFloat(opts.min) || 0;
            const max = parseFloat(opts.max) || 1000;
            const decimals = parseInt(opts.decimals) || 2;
            return parseFloat(faker.number.float({ min, max, fractionDigits: decimals }).toFixed(decimals));
        }
        case 'city':
            return faker.location.city();
        case 'country':
            return faker.location.country();
        case 'address':
            return faker.location.streetAddress();
        case 'zipCode':
            return faker.location.zipCode();
        case 'company':
            return faker.company.name();
        case 'url':
            return faker.internet.url();
        case 'ip':
            return faker.internet.ipv4();
        case 'paragraph':
            return faker.lorem.paragraph();
        case 'sentence':
            return faker.lorem.sentence();
        case 'word':
            return faker.lorem.word();
        case 'color':
            return faker.color.rgb();
        default:
            return faker.lorem.word();
    }
}

/* ── Format Generators ────────────────────────────────── */
function generateRows(faker, schema, count) {
    const rows = [];
    for (let i = 0; i < count; i++) {
        const row = {};
        for (const field of schema) {
            row[field.name] = generateValue(faker, field.type, i, field.options);
        }
        rows.push(row);
    }
    return rows;
}

function toJSON(rows) {
    return JSON.stringify(rows, null, 2);
}

function toCSV(rows, schema) {
    if (rows.length === 0) return '';
    const header = schema.map(f => f.name).join(',');
    const body = rows.map(row => {
        return schema.map(f => {
            const v = row[f.name];
            if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
            return String(v);
        }).join(',');
    }).join('\n');
    return header + '\n' + body;
}

function toSQL(rows, schema, tableName) {
    if (rows.length === 0) return '';
    const cols = schema.map(f => f.name).join(', ');
    const lines = rows.map(row => {
        const vals = schema.map(f => {
            const v = row[f.name];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
            if (typeof v === 'number') return String(v);
            return `'${String(v).replace(/'/g, "''")}'`;
        }).join(', ');
        return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`;
    }).join('\n');
    return lines;
}

/* ── Chunked Generation (for large sets) ──────────────── */
async function generateChunked(faker, schema, totalCount, format, tableName, onProgress) {
    const CHUNK = 5000;
    let allRows = [];
    let processed = 0;

    while (processed < totalCount) {
        const batchSize = Math.min(CHUNK, totalCount - processed);
        const chunk = generateRows(faker, schema, batchSize);

        // For ID continuity
        if (schema.some(f => f.type === 'id')) {
            for (const row of chunk) {
                for (const field of schema) {
                    if (field.type === 'id') {
                        row[field.name] = processed + chunk.indexOf(row) + 1;
                    }
                }
            }
            // Re-assign IDs correctly using index tracking
            for (let i = 0; i < chunk.length; i++) {
                for (const field of schema) {
                    if (field.type === 'id') {
                        chunk[i][field.name] = processed + i + 1;
                    }
                }
            }
        }

        allRows = allRows.concat(chunk);
        processed += batchSize;

        if (onProgress) {
            onProgress(Math.min(processed / totalCount, 1));
        }

        // Yield to event loop for UI responsiveness
        if (processed < totalCount) {
            await new Promise(r => setTimeout(r, 0));
        }
    }

    // Format
    switch (format) {
        case 'csv': return toCSV(allRows, schema);
        case 'sql': return toSQL(allRows, schema, tableName || 'data');
        default: return toJSON(allRows);
    }
}

/* ── Expose to window ─────────────────────────────────── */
window.ToolShelf.MockDataEngine = {
    loadFaker,
    PRESETS,
    FIELD_TYPES,
    generateRows,
    generateValue,
    toJSON,
    toCSV,
    toSQL,
    generateChunked
};
