/**
 * ToolShelf Keyboard Shortcut Component
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.Keyboard = {
    shortcuts: new Map(),
    helpVisible: false,

    init() {
        this.registerGlobalShortcuts();
        console.log('⌨️ Keyboard shortcuts initialized');
    },

    registerGlobalShortcuts() {
        const { GlobalKeyboard } = window.ToolShelf;

        // Global app shortcuts
        GlobalKeyboard.register('Ctrl+/', () => this.showHelp(), { ignoreInputs: true });
        GlobalKeyboard.register('Ctrl+k', () => this.focusSearch(), { ignoreInputs: true });
        GlobalKeyboard.register('F1', () => this.showHelp(), { ignoreInputs: true });

        // Tool-specific shortcuts will be registered by individual tools
    },

    /**
     * Register a keyboard shortcut
     */
    register(key, callback, description, toolId = 'global') {
        const shortcutId = `${toolId}:${key}`;

        this.shortcuts.set(shortcutId, {
            key,
            callback,
            description,
            toolId
        });

        // Register with global keyboard manager
        window.ToolShelf.GlobalKeyboard.register(key, callback);

        console.log(`⌨️ Shortcut registered: ${key} (${toolId})`);
    },

    /**
     * Unregister a keyboard shortcut
     */
    unregister(key, toolId = 'global') {
        const shortcutId = `${toolId}:${key}`;

        if (this.shortcuts.has(shortcutId)) {
            this.shortcuts.delete(shortcutId);
            window.ToolShelf.GlobalKeyboard.unregister(key);
            console.log(`❌ Shortcut unregistered: ${key} (${toolId})`);
        }
    },

    /**
     * Get shortcuts for a specific tool
     */
    getToolShortcuts(toolId) {
        const toolShortcuts = [];

        this.shortcuts.forEach((shortcut, id) => {
            if (shortcut.toolId === toolId) {
                toolShortcuts.push(shortcut);
            }
        });

        return toolShortcuts;
    },

    /**
     * Show keyboard shortcuts help
     */
    showHelp() {
        const currentTool = window.app?.currentTool || 'global';
        const globalShortcuts = this.getToolShortcuts('global');
        const toolShortcuts = this.getToolShortcuts(currentTool);

        let helpText = '⌨️ Keyboard Shortcuts:\n\n';

        if (globalShortcuts.length > 0) {
            helpText += 'Global:\n';
            globalShortcuts.forEach(({ key, description }) => {
                helpText += `  ${key}: ${description}\n`;
            });
            helpText += '\n';
        }

        if (toolShortcuts.length > 0) {
            helpText += `${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}:\n`;
            toolShortcuts.forEach(({ key, description }) => {
                helpText += `  ${key}: ${description}\n`;
            });
        }

        if (window.ToolShelf.Toast) {
            window.ToolShelf.Toast.info(helpText, 6000);
        } else {
            alert(helpText);
        }
    },

    /**
     * Focus search (placeholder for future search feature)
     */
    focusSearch() {
        // Future implementation for global search
        if (window.ToolShelf.Toast) {
            window.ToolShelf.Toast.info('Global search coming soon!', 2000);
        }
    },

    /**
     * Format key string for display
     */
    formatKeyString(key) {
        return key
            .replace('Ctrl+', '⌘')
            .replace('Alt+', '⌥')
            .replace('Shift+', '⇧')
            .replace('Enter', '↵')
            .replace('Escape', '⎋');
    }
};