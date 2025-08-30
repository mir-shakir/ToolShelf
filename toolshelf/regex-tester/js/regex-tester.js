window.ToolShelf = window.ToolShelf || {};

const REGEX_CHEAT_SHEET = [
    { token: '\\d', description: 'Any digit' },
    { token: '\\D', description: 'Not a digit' },
    { token: '\\w', description: 'Word character' },
    { token: '\\W', description: 'Not a word character' },
    { token: '\\s', description: 'Whitespace' },
    { token: '\\S', description: 'Not whitespace' },
    { token: '.', description: 'Any character but newline' },
    { token: '[abc]', description: 'Any of a, b, c' },
    { token: '[^abc]', description: 'Not a, b, c' },
    { token: '[a-z]', description: 'Range a to z' },
    { token: '*', description: '0 or more times' },
    { token: '+', description: '1 or more times' },
    { token: '?', description: '0 or 1 time' },
    { token: '{3}', description: 'Exactly 3 times' },
    { token: '{3,}', description: '3 or more times' },
    { token: '{3,6}', description: 'Between 3 and 6 times' },
    { token: '^', description: 'Start of string' },
    { token: '$', description: 'End of string' },
    { token: '\\b', description: 'Word boundary' },
    { token: '(...)', description: 'Capture group' },
    { token: '(a|b)', description: 'a or b' },
];

window.ToolShelf.RegexTester = class RegexTester extends window.ToolShelf.BaseTool {
    constructor() {
        super('regex-tester');

        // State
        this.regex = null;
        this.flags = 'g';
        this.testString = '';

        // DOM elements
        this.elements = {};

        this.init();
    }

    init() {
        console.log('📝 Initializing Regex Tester...');
        try {
            this.initializeElements();
            this.initializeUI();
            super.init();
            this.populateCheatSheet();
            this.runTest();
            console.log('✅ Regex Tester initialized successfully');
        } catch (error) {
            this.handleError(error, 'Failed to initialize Regex Tester');
        }
    }

    initializeElements() {
        const elementIds = [
            'regexInput', 'regexFlags', 'testString', 'testStringHighlight', 'matchResults', 'cheatSheet'
        ];
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
            if (!this.elements[id]) {
                throw new Error(`Required DOM element not found: #${id}`);
            }
        });

        // Flag checkboxes
        this.elements.flagGlobal = document.getElementById('flagGlobal');
        this.elements.flagIgnoreCase = document.getElementById('flagIgnoreCase');
        this.elements.flagMultiline = document.getElementById('flagMultiline');

        console.log('🎯 Regex Tester DOM elements initialized');
    }

    initializeUI() {
        this.addEventListener(this.elements.regexInput, 'input', () => this.runTest());
        this.addEventListener(this.elements.testString, 'input', () => this.runTest());
        this.addEventListener(this.elements.regexFlags, 'change', () => this.runTest());

        // Sync scroll positions
        this.addEventListener(this.elements.testString, 'scroll', () => {
            this.elements.testStringHighlight.scrollTop = this.elements.testString.scrollTop;
            this.elements.testStringHighlight.scrollLeft = this.elements.testString.scrollLeft;
        });

        console.log('🎨 Regex Tester UI handlers initialized');
    }

    runTest() {
        const pattern = this.elements.regexInput.value;
        const testString = this.elements.testString.value;
        this.flags = Array.from(this.elements.regexFlags.querySelectorAll('input:checked'))
                           .map(cb => cb.value)
                           .join('');

        // Update highlighting
        this.updateHighlighting(pattern, testString);

        // Update match results
        this.updateMatchResults(pattern, testString);
    }

    updateHighlighting(pattern, testString) {
        if (!pattern) {
            this.elements.testStringHighlight.innerHTML = this.escapeHTML(testString);
            return;
        }

        // Highlighting should always be global to show all potential matches
        const highlightFlags = this.flags.includes('g') ? this.flags : this.flags + 'g';

        try {
            const regex = new RegExp(pattern, highlightFlags);
            const highlighted = this.escapeHTML(testString).replace(regex, '<mark>$&</mark>');
            this.elements.testStringHighlight.innerHTML = highlighted;
            this.elements.regexInput.parentElement.classList.remove('error');
        } catch (e) {
            this.elements.testStringHighlight.innerHTML = this.escapeHTML(testString);
            this.elements.regexInput.parentElement.classList.add('error');
        }
    }

    updateMatchResults(pattern, testString) {
        this.elements.matchResults.innerHTML = ''; // Clear previous results

        if (!pattern) {
            this.elements.matchResults.innerHTML = '<p class="no-matches">Enter a regular expression to see matches.</p>';
            return;
        }

        try {
            const regex = new RegExp(pattern, this.flags);
            const matches = [...testString.matchAll(regex)];

            if (matches.length === 0) {
                this.elements.matchResults.innerHTML = '<p class="no-matches">No matches found.</p>';
                return;
            }

            matches.forEach((match) => {
                const matchEl = document.createElement('div');
                matchEl.classList.add('match-item');

                let matchHTML = `
                    <div class="match-header">${this.escapeHTML(match[0])}</div>
                    <span class="match-details">Index: ${match.index}</span>
                `;

                if (match.length > 1) {
                    matchHTML += '<ul class="capture-groups">';
                    for (let j = 1; j < match.length; j++) {
                        const groupContent = match[j] === undefined ? '<em>undefined</em>' : this.escapeHTML(match[j]);
                        matchHTML += `
                            <li class="capture-group">
                                <span class="group-index">${j}:</span>
                                <span>${groupContent}</span>
                            </li>
                        `;
                    }
                    matchHTML += '</ul>';
                }

                matchEl.innerHTML = matchHTML;
                this.elements.matchResults.appendChild(matchEl);
            });

        } catch (e) {
            this.elements.matchResults.innerHTML = `<p class="error-message">Invalid Regex: ${this.escapeHTML(e.message)}</p>`;
        }
    }

    escapeHTML(str) {
        return str.replace(/[&<>"']/g, match => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[match]));
    }

    populateCheatSheet() {
        this.elements.cheatSheet.innerHTML = ''; // Clear any placeholders
        REGEX_CHEAT_SHEET.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.classList.add('cheatsheet-item');
            itemEl.innerHTML = `<span class="token">${this.escapeHTML(item.token)}</span> <span class="description">${this.escapeHTML(item.description)}</span>`;
            itemEl.title = `Insert "${item.token}"`;

            this.addEventListener(itemEl, 'click', () => {
                this.insertAtCursor(this.elements.regexInput, item.token);
                this.runTest();
            });

            this.elements.cheatSheet.appendChild(itemEl);
        });
    }

    insertAtCursor(input, textToInsert) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        input.value = text.substring(0, start) + textToInsert + text.substring(end);
        input.selectionStart = input.selectionEnd = start + textToInsert.length;
        input.focus();
    }
};
