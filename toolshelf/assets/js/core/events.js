/**
 * ToolShelf Event Management System
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.EventManager = {
    listeners: new Map(),
    
    /**
     * Add event listener with automatic cleanup tracking
     */
    on(element, event, handler, options = {}) {
        const listenerId = this.generateListenerId();
        
        element.addEventListener(event, handler, options);
        
        // Track for cleanup
        if (!this.listeners.has(element)) {
            this.listeners.set(element, []);
        }
        
        this.listeners.get(element).push({
            id: listenerId,
            event,
            handler,
            options
        });
        
        return listenerId;
    },
    
    /**
     * Remove specific event listener
     */
    off(element, event, handler) {
        element.removeEventListener(event, handler);
        
        // Clean up tracking
        const elementListeners = this.listeners.get(element);
        if (elementListeners) {
            const index = elementListeners.findIndex(l => 
                l.event === event && l.handler === handler
            );
            if (index !== -1) {
                elementListeners.splice(index, 1);
            }
        }
    },
    
    /**
     * Remove all listeners for an element
     */
    removeAllListeners(element) {
        const elementListeners = this.listeners.get(element);
        if (elementListeners) {
            elementListeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
            this.listeners.delete(element);
        }
    },
    
    /**
     * Clean up all event listeners
     */
    cleanup() {
        this.listeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.listeners.clear();
    },
    
    /**
     * Generate unique listener ID
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Debounced event listener
     */
    onDebounced(element, event, handler, delay = 100, options = {}) {
        const debouncedHandler = window.ToolShelf.Utils.debounce(handler, delay);
        return this.on(element, event, debouncedHandler, options);
    },
    
    /**
     * Throttled event listener
     */
    onThrottled(element, event, handler, limit = 100, options = {}) {
        const throttledHandler = window.ToolShelf.Utils.throttle(handler, limit);
        return this.on(element, event, throttledHandler, options);
    },
    
    /**
     * One-time event listener
     */
    once(element, event, handler, options = {}) {
        const onceHandler = (e) => {
            handler(e);
            this.off(element, event, onceHandler);
        };
        return this.on(element, event, onceHandler, options);
    }
};

// Global keyboard management
window.ToolShelf.GlobalKeyboard = {
    shortcuts: new Map(),
    
    init() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        console.log('🎹 Global keyboard manager initialized');
    },
    
    handleKeydown(e) {
        const key = this.getKeyString(e);
        const handler = this.shortcuts.get(key);
        
        if (handler && this.shouldTrigger(e, handler.conditions)) {
            e.preventDefault();
            handler.callback(e);
        }
        
        // Global shortcuts that work everywhere
        this.handleGlobalShortcuts(e);
    },
    
    getKeyString(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
        if (e.altKey) parts.push('Alt');
        if (e.shiftKey) parts.push('Shift');
        parts.push(e.key);
        return parts.join('+');
    },
    
    shouldTrigger(e, conditions = {}) {
        // Check if we should ignore based on focused element
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && 
            (activeElement.tagName === 'INPUT' || 
             activeElement.tagName === 'TEXTAREA' || 
             activeElement.contentEditable === 'true');
        
        if (conditions.ignoreInputs && isInputFocused) {
            return false;
        }
        
        return true;
    },
    
    handleGlobalShortcuts(e) {
        // Focus management
        if (e.key === 'Tab') {
            document.body.classList.add('using-keyboard');
        }
        
        if (e.key === 'Escape') {
            document.activeElement?.blur();
        }
    },
    
    register(keyString, callback, conditions = {}) {
        this.shortcuts.set(keyString, { callback, conditions });
        console.log(`⌨️ Registered shortcut: ${keyString}`);
    },
    
    unregister(keyString) {
        this.shortcuts.delete(keyString);
        console.log(`❌ Unregistered shortcut: ${keyString}`);
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.ToolShelf.GlobalKeyboard.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.ToolShelf.EventManager.cleanup();
});

// Handle mouse interactions for focus management
document.addEventListener('mousedown', () => {
    document.body.classList.remove('using-keyboard');
});