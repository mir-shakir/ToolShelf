window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.AdvancedColorConverter = class AdvancedColorConverter extends window.ToolShelf.BaseTool {
    constructor() {
        super('color-converter');
        this.culori = window.culori;
        this.isUpdating = false;
        this.elements = {};
        this.init();
    }

    init() {
        try {
            this.initializeElements();
            this.initializeColoris();
            this.initializeUI();
            super.init();
            this.updateColor('#3b82f6', 'init');
        } catch (error) {
            this.handleError(error, 'Failed to initialize Color Converter');
        }
    }

    initializeElements() {
        const ids = [
            'colorSwatch', 'colorPickerInput', 'hexInput', 'copyHex',
            'rSlider', 'rInput', 'gSlider', 'gInput', 'bSlider', 'bInput', 'aSlider', 'aInput',
            'hSlider', 'hInput', 'sSlider', 'sInput', 'lSlider', 'lInput', 'hslaASlider', 'hslaAInput',
            'hwbOutput', 'copyHwb', 'lchOutput', 'copyLch',
            'scoreVsWhite', 'ratingVsWhite', 'scoreVsBlack', 'ratingVsBlack',
            'generatePaletteBtn', 'paletteContainer'
        ];
        ids.forEach(id => this.elements[id] = document.getElementById(id));
    }

    initializeColoris() {
        Coloris({
            el: '#colorPickerInput',
            themeMode: document.documentElement.getAttribute('data-theme') || 'light',
            alpha: true,
            format: 'hex',
            onChange: color => this.updateColor(color, 'picker')
        });
        this.elements.colorSwatch.addEventListener('click', () => {
            this.elements.colorPickerInput.dispatchEvent(new Event('click', { bubbles: true }));
        });
    }

    initializeUI() {
        this.addEventListener(this.elements.hexInput, 'input', e => this.updateColor(e.target.value, 'hex'));

        ['r', 'g', 'b', 'a'].forEach(channel => this.bindSliderAndInput(channel, 'rgba'));
        ['h', 's', 'l'].forEach(channel => this.bindSliderAndInput(channel, 'hsla'));
        this.bindSliderAndInput('hslaA', 'hsla');

        this.addEventListener(this.elements.copyHex, 'click', () => this.copyColor(this.elements.hexInput.value, 'HEX'));
        this.addEventListener(this.elements.copyHwb, 'click', () => this.copyColor(this.elements.hwbOutput.value, 'HWB'));
        this.addEventListener(this.elements.copyLch, 'click', () => this.copyColor(this.elements.lchOutput.value, 'LCH'));

        this.addEventListener(this.elements.generatePaletteBtn, 'click', () => this.generatePalette());
    }

    copyColor(value, format) {
        window.ToolShelf.Utils.copyToClipboard(value)
            .then(success => this.showToast(success ? `${format} color copied!` : `Failed to copy ${format}`, success ? 'success' : 'error'));
    }

    bindSliderAndInput(channel, type = 'rgba') {
        const slider = this.elements[`${channel}Slider`];
        const input = this.elements[`${channel}Input`];
        const handler = type === 'rgba' ? () => this.handleRgbaChange() : () => this.handleHslaChange();

        this.addEventListener(slider, 'input', () => {
            if (this.isUpdating) return;
            input.value = slider.value;
            handler();
        });
        this.addEventListener(input, 'input', () => {
            if (this.isUpdating) return;
            slider.value = input.value;
            handler();
        });
    }

    handleRgbaChange() {
        const color = {
            mode: 'rgb',
            r: this.elements.rInput.value / 255,
            g: this.elements.gInput.value / 255,
            b: this.elements.bInput.value / 255,
            alpha: this.elements.aInput.value
        };
        this.updateColor(color, 'rgba');
    }

    handleHslaChange() {
        const color = {
            mode: 'hsl',
            h: this.elements.hInput.value,
            s: this.elements.sInput.value / 100,
            l: this.elements.lInput.value / 100,
            alpha: this.elements.hslaAInput.value
        };
        this.updateColor(color, 'hsla');
    }

    updateColor(newColor, source = 'init') {
        if (this.isUpdating) return;
        this.isUpdating = true;

        const parsed = this.culori.parse(newColor);
        if (!parsed) {
            this.isUpdating = false;
            return;
        }
        this.currentColor = parsed;

        const rgb = this.culori.to('rgb')(this.currentColor);
        const hsl = this.culori.to('hsl')(this.currentColor);

        if (source !== 'hex') this.elements.hexInput.value = this.culori.formatHex(this.currentColor);
        if (source !== 'rgba') this.updateRgbaInputs(rgb);
        if (source !== 'hsla') this.updateHslaInputs(hsl);

        const displayColor = this.culori.formatRgb(this.currentColor);
        this.elements.colorSwatch.style.backgroundColor = displayColor;

        if (source !== 'picker') {
            this.elements.colorPickerInput.value = displayColor;
            this.elements.colorPickerInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        this.updateInfoPanels();
        this.isUpdating = false;
    }

    updateRgbaInputs(rgb) {
        this.elements.rSlider.value = this.elements.rInput.value = Math.round(rgb.r * 255);
        this.elements.gSlider.value = this.elements.gInput.value = Math.round(rgb.g * 255);
        this.elements.bSlider.value = this.elements.bInput.value = Math.round(rgb.b * 255);
        this.elements.aSlider.value = this.elements.aInput.value = rgb.alpha === undefined ? 1 : rgb.alpha.toFixed(2);
    }

    updateHslaInputs(hsl) {
        this.elements.hSlider.value = this.elements.hInput.value = Math.round(hsl.h || 0);
        this.elements.sSlider.value = this.elements.sInput.value = Math.round((hsl.s || 0) * 100);
        this.elements.lSlider.value = this.elements.lInput.value = Math.round((hsl.l || 0) * 100);
        this.elements.hslaASlider.value = this.elements.hslaAInput.value = hsl.alpha === undefined ? 1 : hsl.alpha.toFixed(2);
    }

    updateInfoPanels() {
        // Modern Formats
        this.elements.hwbOutput.value = this.culori.formatHwb(this.currentColor);
        this.elements.lchOutput.value = this.culori.formatLch(this.currentColor);

        // WCAG Contrast
        const contrastWhite = this.culori.contrast(this.currentColor, 'white');
        const contrastBlack = this.culori.contrast(this.currentColor, 'black');
        this.updateContrastItem(this.elements.scoreVsWhite, this.elements.ratingVsWhite, contrastWhite);
        this.updateContrastItem(this.elements.scoreVsBlack, this.elements.ratingVsBlack, contrastBlack);
    }

    updateContrastItem(scoreEl, ratingEl, ratio) {
        scoreEl.textContent = ratio.toFixed(2);
        const rating = (ratio >= 7) ? 'AAA' : (ratio >= 4.5) ? 'AA' : 'Fail';
        ratingEl.textContent = rating;
        ratingEl.className = 'rating-badge';
        ratingEl.classList.add(rating === 'Fail' ? 'fail' : 'pass');
    }

    generatePalette() {
        const baseHsl = this.culori.to('hsl')(this.currentColor);
        const palette = [
            this.currentColor,
            { ...baseHsl, h: (baseHsl.h + 180) % 360 }, // Complementary
            { ...baseHsl, h: (baseHsl.h + 120) % 360 }, // Triadic 1
            { ...baseHsl, h: (baseHsl.h + 240) % 360 }, // Triadic 2
            { ...baseHsl, l: Math.min(1, baseHsl.l + 0.2) } // Lighter
        ];

        this.elements.paletteContainer.innerHTML = '';
        palette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.classList.add('palette-swatch');
            const colorRgb = this.culori.formatRgb(color);
            swatch.style.backgroundColor = colorRgb;
            swatch.title = `Set color to ${colorRgb}`;
            this.addEventListener(swatch, 'click', () => this.updateColor(color, 'palette'));
            this.elements.paletteContainer.appendChild(swatch);
        });
    }
};
