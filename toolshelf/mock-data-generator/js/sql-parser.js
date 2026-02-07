/**
 * ToolShelf SQL Schema Parser
 *
 * Parses CREATE TABLE statements (MySQL, PostgreSQL, SQLite, SQL Server, generic DDL)
 * and maps SQL column types to Faker field types for the Mock Data Generator.
 *
 * Strategy: Multiple extraction passes to handle varied SQL dialects.
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.SQLSchemaParser = (() => {
    'use strict';

    /* ── SQL-Type → Faker-Type Mapping ──────────────── */
    const TYPE_MAP = [
        // UUIDs
        { pattern: /\buuid\b/i,                          faker: 'uuid' },
        // Booleans
        { pattern: /\b(bool|boolean|bit|tinyint\(1\))\b/i, faker: 'boolean' },
        // Emails (by column name)
        { pattern: null, namePattern: /email/i,           faker: 'email' },
        // Phone (by column name)
        { pattern: null, namePattern: /phone|mobile|fax|tel/i, faker: 'phone' },
        // URL (by column name)
        { pattern: null, namePattern: /\b(url|website|href|link)\b/i, faker: 'url' },
        // IP (by column name)
        { pattern: null, namePattern: /\b(ip|ip_address|ipv4|ipv6)\b/i, faker: 'ip' },
        // City (by column name)
        { pattern: null, namePattern: /\bcity\b/i,        faker: 'city' },
        // Country (by column name)
        { pattern: null, namePattern: /\bcountry\b/i,     faker: 'country' },
        // Zip (by column name)
        { pattern: null, namePattern: /\b(zip|zipcode|zip_code|postal)\b/i, faker: 'zipCode' },
        // Address (by column name)
        { pattern: null, namePattern: /\b(address|street)\b/i, faker: 'address' },
        // First name (by column name)
        { pattern: null, namePattern: /\b(first_?name|fname)\b/i, faker: 'firstName' },
        // Last name (by column name)
        { pattern: null, namePattern: /\b(last_?name|lname|surname)\b/i, faker: 'lastName' },
        // Full name (by column name)
        { pattern: null, namePattern: /\b(name|full_?name|username|user_?name)\b/i, faker: 'name' },
        // Company (by column name)
        { pattern: null, namePattern: /\b(company|organization|org_name)\b/i, faker: 'company' },
        // Color (by column name)
        { pattern: null, namePattern: /\bcolor\b/i,       faker: 'color' },
        // Datetime types
        { pattern: /\b(datetime|timestamp|timestamptz)\b/i, faker: 'datetime' },
        // Date types
        { pattern: /\bdate\b/i,                           faker: 'date' },
        // Floating-point types
        { pattern: /\b(float|double|real|decimal|numeric|money|smallmoney)\b/i, faker: 'float' },
        // Auto-increment / serial (ID-like)
        { pattern: /\b(serial|bigserial|smallserial)\b/i,  faker: 'id' },
        // Integer types
        { pattern: /\b(int|integer|bigint|smallint|mediumint|tinyint)\b/i, faker: 'integer' },
        // Long text
        { pattern: /\b(text|longtext|mediumtext|clob|ntext)\b/i, faker: 'paragraph' },
        // Short string — match VARCHAR(n), CHAR(n), NVARCHAR, etc.
        { pattern: /\b(varchar|char|nvarchar|nchar|character varying|character)\b/i, faker: 'sentence' },
        // JSON
        { pattern: /\bjsonb?\b/i,                         faker: 'sentence' },
        // Binary / blob
        { pattern: /\b(blob|binary|varbinary|bytea|image)\b/i, faker: 'sentence' },
        // Enum
        { pattern: /\benum\b/i,                           faker: 'word' },
    ];

    /* ── Column-Name Heuristics (applied AFTER type mapping) ── */
    function inferByColumnName(name) {
        for (const rule of TYPE_MAP) {
            if (rule.namePattern && rule.namePattern.test(name)) {
                return rule.faker;
            }
        }
        return null;
    }

    /* ── Map SQL type string → Faker type ─────────────── */
    function mapSqlType(sqlType, columnName) {
        const normalized = sqlType.trim();

        // 1) Try name-based inference first (higher priority for semantic accuracy)
        const byName = inferByColumnName(columnName);
        if (byName) return { type: byName, options: {} };

        // 2) Try type-based matching
        for (const rule of TYPE_MAP) {
            if (rule.pattern && rule.pattern.test(normalized)) {
                const result = { type: rule.faker, options: {} };

                // Extract numeric precision for float/decimal
                if (rule.faker === 'float') {
                    const precMatch = normalized.match(/\((\d+)\s*,\s*(\d+)\)/);
                    if (precMatch) {
                        result.options.decimals = precMatch[2];
                    }
                }

                // Extract range hints from integer constraints (none in DDL normally)
                return result;
            }
        }

        // 3) Fallback
        return { type: 'sentence', options: {} };
    }

    /* ── Detect & strip AUTO_INCREMENT / identity markers ─ */
    function isAutoIncrement(colDef) {
        return /auto_increment|autoincrement|serial|generated\s+always\s+as\s+identity|identity\s*\(/i.test(colDef);
    }

    /* ── Main Parse Function ──────────────────────────── */
    function parse(sql) {
        const result = {
            tableName: '',
            fields: [],
            errors: [],
            warnings: []
        };

        if (!sql || !sql.trim()) {
            result.errors.push('No SQL provided');
            return result;
        }

        const cleaned = cleanSQL(sql);

        // Try multiple extraction strategies
        let extracted = extractFromCreateTable(cleaned) ||
                        extractFromColumnList(cleaned) ||
                        extractFromLooseColumns(cleaned);

        if (!extracted || extracted.columns.length === 0) {
            result.errors.push('Could not parse any column definitions from the provided SQL. Please check the syntax.');
            return result;
        }

        result.tableName = extracted.tableName || 'data';

        // Map each extracted column to a Faker field
        for (const col of extracted.columns) {
            const mapped = mapSqlType(col.type, col.name);

            // If it's auto-increment, override to 'id'
            if (col.autoIncrement) {
                mapped.type = 'id';
                mapped.options = {};
            }

            result.fields.push({
                name: col.name,
                type: mapped.type,
                options: mapped.options,
                sqlType: col.type,
                nullable: col.nullable
            });
        }

        if (result.fields.length === 0) {
            result.errors.push('No valid columns could be extracted from the SQL.');
        }

        return result;
    }

    /* ── SQL Cleaning ─────────────────────────────────── */
    function cleanSQL(sql) {
        let s = sql;

        // Remove SQL comments: -- line comments and /* block comments */
        s = s.replace(/--[^\n]*/g, '');
        s = s.replace(/\/\*[\s\S]*?\*\//g, '');

        // Normalize whitespace
        s = s.replace(/\r\n/g, '\n');
        s = s.replace(/\t/g, ' ');
        s = s.replace(/\n+/g, '\n');

        return s.trim();
    }

    /* ── Strategy 1: Standard CREATE TABLE ────────────── */
    function extractFromCreateTable(sql) {
        // Match CREATE TABLE (with optional IF NOT EXISTS, OR REPLACE, TEMP, etc.)
        const createMatch = sql.match(
            /CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"[\]]?(\w+(?:\.\w+)?)[`"\].]?\s*\(/is
        );

        if (!createMatch) return null;

        const tableName = createMatch[1].replace(/.*\./, ''); // strip schema prefix

        // Extract content between the outer parentheses
        const startIdx = sql.indexOf('(', createMatch.index + createMatch[0].length - 1);
        const innerContent = extractParenContent(sql, startIdx);

        if (!innerContent) return null;

        const columns = parseColumnDefinitions(innerContent);

        return { tableName, columns };
    }

    /* ── Strategy 2: Just a column-list without CREATE TABLE ── */
    function extractFromColumnList(sql) {
        // If user just pasted column definitions line by line
        // e.g.:
        //   id INT PRIMARY KEY,
        //   name VARCHAR(255),
        //   email VARCHAR(100)
        const lines = sql.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        // Heuristic: at least 2 lines, each looks like "word TYPE..."
        const columnPattern = /^[`"[\]]?(\w+)[`"\]]?\s+([\w()]+)/;
        const potentialCols = lines.filter(l => columnPattern.test(l));

        if (potentialCols.length < 2) return null;

        // Join back and parse
        const joined = potentialCols.join(',\n');
        const columns = parseColumnDefinitions(joined);

        if (columns.length < 2) return null;

        return { tableName: 'data', columns };
    }

    /* ── Strategy 3: Loose column extraction (last resort) ── */
    function extractFromLooseColumns(sql) {
        // Try to find anything that looks like column definitions
        // Very permissive regex: word followed by a type keyword
        const typeKeywords = 'int|integer|bigint|smallint|tinyint|serial|bigserial|varchar|char|nvarchar|text|longtext|mediumtext|clob|float|double|real|decimal|numeric|money|bool|boolean|bit|date|datetime|timestamp|timestamptz|time|uuid|json|jsonb|blob|binary|varbinary|bytea|enum|set';
        const regex = new RegExp(
            `[\\s,;(]["\`\\[]?(\\w+)["\`\\]]?\\s+((?:${typeKeywords})(?:\\s*\\([^)]*\\))?)`,
            'gi'
        );

        const columns = [];
        let match;
        const seen = new Set();

        while ((match = regex.exec(sql)) !== null) {
            const name = match[1].toLowerCase();
            // Skip SQL keywords that aren't column names
            if (/^(table|create|primary|foreign|unique|index|constraint|key|references|check|default|not|null|on|delete|update|cascade|set|no|action|if|exists|or|replace|temp|temporary)$/i.test(name)) {
                continue;
            }
            if (seen.has(name)) continue;
            seen.add(name);

            columns.push({
                name: match[1],
                type: match[2].trim(),
                autoIncrement: false,
                nullable: true
            });
        }

        if (columns.length === 0) return null;
        return { tableName: 'data', columns };
    }

    /* ── Parse comma-separated column definitions ─────── */
    function parseColumnDefinitions(content) {
        const columns = [];

        // Split by comma, but respect parentheses (e.g., DECIMAL(10,2))
        const parts = smartSplit(content, ',');

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

            // Skip table-level constraints
            if (/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|INDEX|KEY|CHECK|CONSTRAINT|EXCLUDE)/i.test(trimmed)) {
                continue;
            }

            const col = parseOneColumn(trimmed);
            if (col) columns.push(col);
        }

        return columns;
    }

    /* ── Parse a single column definition ─────────────── */
    function parseOneColumn(def) {
        // Remove leading/ending whitespace, backticks, brackets, quotes
        let d = def.trim();

        // Match: [optional quotes] column_name [optional quotes] TYPE [rest]
        const match = d.match(/^[`"[\]]?(\w+)[`"\]]?\s+(.+)/i);
        if (!match) return null;

        const name = match[1];
        let rest = match[2].trim();

        // Skip if name looks like a SQL keyword that starts a constraint
        if (/^(primary|foreign|unique|index|key|check|constraint)$/i.test(name)) {
            return null;
        }

        // Extract the SQL type (may include parenthesized arguments)
        let sqlType = '';
        const typeMatch = rest.match(/^([\w\s]+(?:\([^)]*\))?)/);
        if (typeMatch) {
            sqlType = typeMatch[1].trim();
            // Clean up: take only the type part (e.g., "VARCHAR(255)" from "VARCHAR(255) NOT NULL DEFAULT ...")
            // Also handle multi-word types like "CHARACTER VARYING(100)" or "DOUBLE PRECISION"
            const cleanedType = sqlType.replace(/\s*(UNSIGNED|SIGNED|ZEROFILL|NOT\s+NULL|NULL|DEFAULT|PRIMARY|UNIQUE|CHECK|REFERENCES|GENERATED|AUTO_INCREMENT|AUTOINCREMENT|IDENTITY|SERIAL|COLLATE|COMMENT|CONSTRAINT).*/i, '').trim();
            if (cleanedType) sqlType = cleanedType;
        }

        if (!sqlType) return null;

        return {
            name: name,
            type: sqlType,
            autoIncrement: isAutoIncrement(d),
            nullable: !/\bNOT\s+NULL\b/i.test(d)
        };
    }

    /* ── Extract content within balanced parentheses ──── */
    function extractParenContent(sql, startIdx) {
        if (sql[startIdx] !== '(') return null;

        let depth = 0;
        let i = startIdx;

        for (; i < sql.length; i++) {
            if (sql[i] === '(') depth++;
            else if (sql[i] === ')') {
                depth--;
                if (depth === 0) {
                    return sql.substring(startIdx + 1, i);
                }
            }
        }

        // Unbalanced — return everything after first '('
        return sql.substring(startIdx + 1);
    }

    /* ── Comma-split that respects parentheses ────────── */
    function smartSplit(str, delimiter) {
        const parts = [];
        let depth = 0;
        let current = '';

        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (ch === '(') depth++;
            else if (ch === ')') depth--;

            if (ch === delimiter && depth === 0) {
                parts.push(current);
                current = '';
            } else {
                current += ch;
            }
        }

        if (current.trim()) parts.push(current);
        return parts;
    }

    /* ── Public API ───────────────────────────────────── */
    return {
        parse,
        mapSqlType,
        FIELD_TYPES_LIST: TYPE_MAP
    };
})();
