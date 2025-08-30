window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.AdvancedColorConverter = class AdvancedColorConverter extends window.ToolShelf.BaseTool {
    constructor() {
        super('color-converter');

        // State
        this.currentColor = {};
        this.isUpdating = false; // Flag to prevent event loops

        // External libraries/components
        this.culori = window.culori;

        // DOM elements
        this.elements = {};

        this.init();
    }

    init() {
        console.log('🎨 Initializing Advanced Color Converter...');
        try {
            this.initializeElements();
            this.initializeColoris();
            this.initializeUI();
            super.init();
            this.updateColor('#3b82f6'); // Set initial color
            console.log('✅ Advanced Color Converter initialized successfully');
        } catch (error) {
            this.handleError(error, 'Failed to initialize Advanced Color Converter');
        }
    }

    initializeElements() {
        const elementIds = [
            'colorPickerContainer', 'colorSwatch', 'colorPickerInput', 'hexInput', 'copyHex',
            'rgbaInput', 'copyRgba', 'hslaInput', 'copyHsla', 'hwbOutput', 'copyHwb',
            'lchOutput', 'copyLch', 'contrastVsWhite', 'scoreVsWhite', 'ratingVsWhite',
            'contrastVsBlack', 'scoreVsBlack', 'ratingVsBlack', 'generatePaletteBtn', 'paletteContainer'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
            if (!this.elements[id]) throw new Error(`Required DOM element not found: #${id}`);
        });

        console.log('🎯 Color Converter DOM elements initialized');
    }

    initializeColoris() {
        Coloris.init();
        Coloris({
            el: '#colorPickerInput',
            themeMode: document.documentElement.getAttribute('data-theme') || 'light',
            alpha: true,
            format: 'hex',
            onChange: (color) => {
                if (!this.isUpdating) {
                    this.updateColor(color, 'picker');
                }
            }
        });

        // Sync Coloris theme with website theme
        const observer = new MutationObserver(() => {
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            Coloris.setTheme(theme);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        this.elements.colorSwatch.addEventListener('click', () => {
            this.elements.colorPickerInput.dispatchEvent(new Event('click', { bubbles: true }));
        });
    }

    initializeUI() {
        const inputs = [this.elements.hexInput, this.elements.rgbaInput, this.elements.hslaInput];
        inputs.forEach(input => {
            this.addEventListener(input, 'input', (e) => {
                if (!this.isUpdating) {
                    this.updateColor(e.target.value, 'input');
                }
            });
        });

        // Add copy button listeners
        this.addCopyListener('Hex', this.elements.copyHex, () => this.elements.hexInput.value);
        this.addCopyListener('RGBA', this.elements.copyRgba, () => this.elements.rgbaInput.value);
        this.addCopyListener('HSLA', this.elements.copyHsla, () => this.elements.hslaInput.value);
        this.addCopyListener('HWB', this.elements.copyHwb, () => this.elements.hwbOutput.value);
        this.addCopyListener('LCH', this.elements.copyLch, () => this.elements.lchOutput.value);

        this.addEventListener(this.elements.generatePaletteBtn, 'click', () => this.generatePalette());

        console.log('🎨 Color Converter UI handlers initialized');
    }

    addCopyListener(format, button, valueGetter) {
        this.addEventListener(button, 'click', async () => {
            const textToCopy = valueGetter();
            const success = await window.ToolShelf.Utils.copyToClipboard(textToCopy);
            if (success) {
                this.showToast(`${format} color copied to clipboard!`);
            } else {
                this.showToast(`Failed to copy ${format} color.`, 'error');
            }
        });
    }

    updateColor(newColor, source = 'init') {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            const parsed = this.culori.parse(newColor);
            if (!parsed) {
                // TODO: Add validation feedback
                this.isUpdating = false;
                return;
            }
            this.currentColor = parsed;

            // Update text inputs
            if (source !== 'input') {
                this.elements.hexInput.value = this.culori.formatHex(this.currentColor);
                this.elements.rgbaInput.value = this.culori.formatRgb(this.currentColor);
                this.elements.hslaInput.value = this.culori.formatHsl(this.currentColor);
            }

            // Update read-only outputs
            this.elements.hwbOutput.value = this.culori.formatHwb(this.currentColor);
            this.elements.lchOutput.value = this.culori.formatLch(this.currentColor);

            // Update UI visuals
            const displayColor = this.culori.formatRgb(this.currentColor);
            this.elements.colorSwatch.style.backgroundColor = displayColor;

            // Update Coloris picker state without re-triggering its onChange
            if (source !== 'picker') {
                this.elements.colorPickerInput.value = displayColor;
                this.elements.colorPickerInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            this.updateContrastInfo();

        } catch (e) {
            console.error("Invalid color:", e);
        }

        this.isUpdating = false;
    }

    getContrastRating(ratio) {
        if (ratio >= 7) return 'AAA';
        if (ratio >= 4.5) return 'AA';
        if (ratio >= 3) return 'AA Large';
        return 'Fail';
    }

    updateContrastInfo() {
        if (!this.currentColor) return;

        const contrastWhite = this.culori.contrast(this.currentColor, 'white');
        const contrastBlack = this.culori.contrast(this.currentColor, 'black');

        const ratingWhite = this.getContrastRating(contrastWhite);
        const ratingBlack = this.getContrastRating(contrastBlack);

        this.elements.scoreVsWhite.textContent = contrastWhite.toFixed(2);
        this.elements.ratingVsWhite.textContent = ratingWhite;
        this.elements.ratingVsWhite.dataset.rating = ratingWhite.toLowerCase().replace(' ', '-');

        this.elements.scoreVsBlack.textContent = contrastBlack.toFixed(2);
        this.elements.ratingVsBlack.textContent = ratingBlack;
        this.elements.ratingVsBlack.dataset.rating = ratingBlack.toLowerCase().replace(' ', '-');
    }

    generatePalette() {
        if (!this.currentColor) {
            this.showToast('Please select a color first.', 'warning');
            return;
        }

        const baseColor = this.culori.to('hsl')(this.currentColor);

        const harmonies = {
            complementary: (baseColor.h + 180) % 360,
            triadic1: (baseColor.h + 120) % 360,
            triadic2: (baseColor.h + 240) % 360,
        };

        const palette = [
            { h: harmonies.complementary, s: baseColor.s, l: baseColor.l },
            { h: harmonies.triadic1, s: baseColor.s, l: baseColor.l },
            { h: harmonies.triadic2, s: baseColor.s, l: baseColor.l },
        ];

        this.elements.paletteContainer.innerHTML = ''; // Clear previous palette

        [this.currentColor, ...palette].forEach(color => {
            const swatch = document.createElement('div');
            swatch.classList.add('palette-swatch');
            const colorRgb = this.culori.formatRgb(color);
            swatch.style.backgroundColor = colorRgb;
            swatch.title = `Set color to ${colorRgb}`;
            swatch.dataset.color = colorRgb;

            this.addEventListener(swatch, 'click', (e) => {
                this.updateColor(e.target.dataset.color);
                window.ToolShelf.Utils.trackEvent('palette_color_selected');
            });

            this.elements.paletteContainer.appendChild(swatch);
        });

        this.showToast('New color palette generated!');
        window.ToolShelf.Utils.trackEvent('palette_generated');
    }
};
