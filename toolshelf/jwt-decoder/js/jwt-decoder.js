// toolshelf/jwt-decoder/js/jwt-decoder.js

window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.JWTDecoder = class JWTDecoder extends window.ToolShelf.BaseTool {
    constructor() {
        super('jwt-decoder');
        console.log('JWTDecoder constructor called.');
        this.elements = {};
        this.init();
    }

    init() {
        console.log('JWTDecoder init started.');
        this.initializeElements();
        this.addEventListeners();
        console.log('JWTDecoder init finished.');
    }

    initializeElements() {
        console.log('Initializing elements...');
        const ids = [
            'jwtInput', 'decodedHeader', 'decodedPayload',
            'secretKey', 'algSelector', 'verificationStatus',
            'pasteBtn', 'uploadBtn', 'fileInput',
            'copyHeaderBtn', 'copyPayloadBtn', 'verifyBtn', 'clearBtn'
        ];
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
            if (!this.elements[id]) {
                console.error(`Element with ID '${id}' not found.`);
            }
        });
        console.log('Elements initialized:', this.elements);
    }

    addEventListeners() {
        console.log('Adding event listeners...');
        if (!this.elements.jwtInput) {
            console.error('jwtInput element not found, cannot add event listeners.');
            return;
        }
        this.elements.jwtInput.addEventListener('input', () => this.decodeJWT());
        this.elements.clearBtn.addEventListener('click', () => this.clearAll());
        this.elements.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.elements.copyHeaderBtn.addEventListener('click', () => this.copyToClipboard('header'));
        this.elements.copyPayloadBtn.addEventListener('click', () => this.copyToClipboard('payload'));
        this.elements.verifyBtn.addEventListener('click', () => this.verifyJWT());
        this.elements.uploadBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (event) => this.handleFileUpload(event));
        console.log('All event listeners added.');
    }

    decodeJWT() {
        console.log('decodeJWT called.');
        const token = this.elements.jwtInput.value.trim();
        this.updateVerificationStatus('', ''); // Clear previous status

        if (!token) {
            this.clearOutput();
            console.log('Token is empty, output cleared.');
            return;
        }

        console.log('Decoding token:', token);
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                this.elements.decodedHeader.textContent = 'Invalid JWT format. A JWT must have 3 parts separated by dots.';
                this.elements.decodedPayload.textContent = '';
                return;
            }

            const header = window.jose.decodeProtectedHeader(token);
            const payload = window.jose.decodeJwt(token);

            console.log('Decoded Header:', header);
            console.log('Decoded Payload:', payload);

            this.elements.decodedHeader.textContent = JSON.stringify(header, null, 2);
            this.highlightJSON(this.elements.decodedHeader);

            this.displayPayload(payload);

            const nowInSeconds = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < nowInSeconds) {
                this.updateVerificationStatus('invalid', 'Warning: Token has expired.');
            } else if (payload.nbf && payload.nbf > nowInSeconds) {
                this.updateVerificationStatus('invalid', 'Warning: Token is not yet valid.');
            }

        } catch (error) {
            console.error('Error decoding JWT:', error);
            this.elements.decodedHeader.textContent = `Error decoding header: ${error.message}`;
            this.elements.decodedPayload.textContent = `Error decoding payload: ${error.message}`;
        }
    }

    displayPayload(payload) {
        const formattedPayload = { ...payload };
        if (formattedPayload.exp) {
            formattedPayload.exp = `${payload.exp} (${this.formatTimestamp(payload.exp)})`;
        }
        if (formattedPayload.iat) {
            formattedPayload.iat = `${payload.iat} (${this.formatTimestamp(payload.iat)})`;
        }
        if (formattedPayload.nbf) {
            formattedPayload.nbf = `${payload.nbf} (${this.formatTimestamp(payload.nbf)})`;
        }
        this.elements.decodedPayload.textContent = JSON.stringify(formattedPayload, null, 2);
        this.highlightJSON(this.elements.decodedPayload);
    }

    clearOutput() {
        console.log('Clearing output.');
        if (this.elements.decodedHeader) this.elements.decodedHeader.textContent = '';
        if (this.elements.decodedPayload) this.elements.decodedPayload.textContent = '';
        if (this.elements.verificationStatus) {
            this.elements.verificationStatus.textContent = '';
            this.elements.verificationStatus.className = 'verification-status';
        }
    }

    clearAll() {
        console.log('Clearing all.');
        this.elements.jwtInput.value = '';
        this.elements.secretKey.value = '';
        this.clearOutput();
    }

    async pasteFromClipboard() {
        console.log('Pasting from clipboard...');
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                this.elements.jwtInput.value = text;
                this.decodeJWT();
            }
        } catch (error) {
            console.error('Failed to paste from clipboard:', error);
            if (window.ToolShelf.Toast) {
                window.ToolShelf.Toast.show('Failed to paste from clipboard.', 'error');
            }
        }
    }

    copyToClipboard(part) {
        console.log(`Copying ${part} to clipboard...`);
        let textToCopy = '';
        if (part === 'header') {
            textToCopy = this.elements.decodedHeader.textContent;
        } else if (part === 'payload') {
            textToCopy = this.elements.decodedPayload.textContent;
        }

        if (textToCopy) {
            window.ToolShelf.Utils.copyToClipboard(textToCopy);
            if (window.ToolShelf.Toast) {
                window.ToolShelf.Toast.show(`Copied ${part} to clipboard!`, 'success');
            }
        }
    }

    highlightJSON(element) {
        if (!element.textContent) return;
        const json = element.textContent;
        const highlighted = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return `<span class="json-${cls}">${match}</span>`;
        });
        element.innerHTML = highlighted;
    }

    async verifyJWT() {
        console.log('Verifying JWT...');
        const token = this.elements.jwtInput.value.trim();
        const secretOrKey = this.elements.secretKey.value.trim();
        const alg = this.elements.algSelector.value;

        if (!token || !secretOrKey) {
            this.updateVerificationStatus('invalid', 'Token and secret/key are required for verification.');
            return;
        }

        try {
            let key;
            if (alg.startsWith('HS')) {
                key = new TextEncoder().encode(secretOrKey);
            } else {
                try {
                    key = await window.jose.importJWK(JSON.parse(secretOrKey), alg);
                } catch (e) {
                    try {
                        if (secretOrKey.includes('PUBLIC KEY')) {
                            key = await window.jose.importSPKI(secretOrKey, alg);
                        } else if (secretOrKey.includes('PRIVATE KEY')) {
                            key = await window.jose.importPKCS8(secretOrKey, alg);
                        } else {
                            throw new Error('Invalid key format. For RSA/ECDSA, provide a key in PEM or JWK format.');
                        }
                    } catch (pemError) {
                        throw new Error(`Failed to import key: ${pemError.message}`);
                    }
                }
            }

            const { payload } = await window.jose.jwtVerify(token, key, { algorithms: [alg] });
            this.updateVerificationStatus('valid', 'Signature is valid.');
            this.displayPayload(payload);

        } catch (error) {
            console.error('Verification failed:', error);
            this.updateVerificationStatus('invalid', `Verification failed: ${error.message}`);
        }
    }

    updateVerificationStatus(status, message) {
        console.log(`Updating verification status: ${status}, ${message}`);
        this.elements.verificationStatus.textContent = message;
        this.elements.verificationStatus.className = `verification-status ${status}`;
    }

    handleFileUpload(event) {
        console.log('Handling file upload...');
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.elements.jwtInput.value = content;
            this.decodeJWT();
        };
        reader.readAsText(file);
    }

    formatTimestamp(timestamp) {
        if (typeof timestamp !== 'number') return '';
        const date = new Date(timestamp * 1000);
        return date.toUTCString();
    }
};
