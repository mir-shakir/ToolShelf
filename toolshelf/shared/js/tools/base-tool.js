/**
 * ToolShelf Base Tool Class
 * Provides common functionality for all tools
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.BaseTool = class BaseTool {
    constructor(toolId) {
        this.toolId = toolId;
        this.isInitialized = false;
        this.eventListeners = [];
        this.performanceMetrics = {
            operationsCount: 0,
            totalProcessingTime: 0,
            lastOperationTime: 0
        };

        console.log(`🔧 Base tool created: ${toolId}`);
    }

    /**
     * Initialize the tool - to be overridden by subclasses
     */
    init() {
        this.isInitialized = true;
        console.log(`✅ Tool initialized: ${this.toolId}`);
    }

    /**
     * Clean up resources when tool is destroyed
     */
    destroy() {
        this.removeAllEventListeners();
        this.isInitialized = false;
        console.log(`🗑️ Tool destroyed: ${this.toolId}`);
    }

    /**
     * Add event listener with automatic tracking
     */
    addEventListener(element, event, handler, options = {}) {
        const listenerId = window.ToolShelf.EventManager.on(element, event, handler, options);
        this.eventListeners.push({ element, event, handler, listenerId });
        return listenerId;
    }

    /**
     * Remove specific event listener
     */
    removeEventListener(element, event, handler) {
        window.ToolShelf.EventManager.off(element, event, handler);

        // Remove from tracking
        const index = this.eventListeners.findIndex(l =>
            l.element === element && l.event === event && l.handler === handler
        );
        if (index !== -1) {
            this.eventListeners.splice(index, 1);
        }
    }

    /**
     * Remove all event listeners for this tool
     */
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            window.ToolShelf.EventManager.off(element, event, handler);
        });
        this.eventListeners = [];
    }

    /**
     * Register keyboard shortcuts for this tool
     */
    registerShortcuts(shortcuts) {
        shortcuts.forEach(({ key, callback, description }) => {
            window.ToolShelf.Keyboard.register(key, callback, description, this.toolId);
        });
    }

    /**
     * Unregister all shortcuts for this tool
     */
    unregisterShortcuts() {
        const shortcuts = window.ToolShelf.Keyboard.getToolShortcuts(this.toolId);
        shortcuts.forEach(({ key }) => {
            window.ToolShelf.Keyboard.unregister(key, this.toolId);
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success', duration) {
        if (type == 'success' || type == 'info') {
            duration = window.ToolShelf.Constants.TOAST_SHORT_DURATION;
        } else if (type == 'error') {
            duration = window.ToolShelf.Constants.TOAST_LONG_DURATION;
        } else {
            duration = window.ToolShelf.Constants.TOAST_MID_DURATION;
        }
        if (window.ToolShelf.Toast) {
            window.ToolShelf.Toast.show(message, type, duration);
        }
    }

    /**
     * Handle errors with proper logging and user feedback
     */
    handleError(error, userMessage = 'An error occurred', context = {}) {
        const errorData = window.ToolShelf.Utils.trackError(error, {
            tool: this.toolId,
            ...context
        });

        console.error(`❌ Error in ${this.toolId}:`, errorData);
        this.showToast(userMessage, 'error', 1000);

        return errorData;
    }

    /**
     * Measure performance of operations
     */
    measurePerformance(operationName, operation) {
        const startTime = performance.now();

        try {
            const result = operation();
            const endTime = performance.now();
            const duration = endTime - startTime;

            this.updatePerformanceMetrics(duration);

            if (duration > window.ToolShelf.Constants.SLOW_OPERATION_THRESHOLD) {
                console.warn(`⚠️ Slow operation in ${this.toolId}.${operationName}: ${duration.toFixed(2)}ms`);
            }

            return result;
        } catch (error) {
            this.handleError(error, `Operation failed: ${operationName}`);
            throw error;
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(duration) {
        this.performanceMetrics.operationsCount++;
        this.performanceMetrics.totalProcessingTime += duration;
        this.performanceMetrics.lastOperationTime = duration;
    }

    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        const { operationsCount, totalProcessingTime } = this.performanceMetrics;

        return {
            operationsCount,
            totalProcessingTime: Math.round(totalProcessingTime),
            averageTime: operationsCount > 0 ? Math.round(totalProcessingTime / operationsCount) : 0,
            lastOperationTime: Math.round(this.performanceMetrics.lastOperationTime)
        };
    }

    /**
     * Called when tool becomes visible - to be overridden
     */
    onShow() {
        console.log(`👁️ Tool shown: ${this.toolId}`);
    }

    /**
     * Called when tool becomes hidden - to be overridden
     */
    onHide() {
        console.log(`🙈 Tool hidden: ${this.toolId}`);
    }

    /**
     * Export tool state - to be overridden
     */
    exportState() {
        return {
            toolId: this.toolId,
            isInitialized: this.isInitialized,
            performanceMetrics: this.getPerformanceStats(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Import tool state - to be overridden
     */
    importState(state) {
        console.log(`📥 Importing state for ${this.toolId}:`, state);
    }

    /**
     * Validate tool configuration
     */
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error(`Invalid configuration for tool: ${this.toolId}`);
        }
        return true;
    }

    /**
     * Get tool metadata
     */
    getMetadata() {
        return {
            id: this.toolId,
            initialized: this.isInitialized,
            eventListeners: this.eventListeners.length,
            performance: this.getPerformanceStats(),
            version: window.ToolShelf.Constants.APP_VERSION
        };
    }
};