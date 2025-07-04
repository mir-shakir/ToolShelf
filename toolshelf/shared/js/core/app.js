/**
 * ToolShelf - Main Application Controller
 * Coordinates all app functionality and tool management
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.App = class ToolShelfApp {
    constructor() {
        this.currentTool = 'text-transformer';
        this.tools = new Map();
        this.isInitialized = false;
        this.startTime = performance.now();

        console.log('🚀 ToolShelf Application starting...');
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.initializeCore();
            await this.initializeComponents();
            await this.initializeTools();
            this.setupGlobalEvents();
            this.finalizeInitialization();

        } catch (error) {
            console.error('❌ Failed to initialize ToolShelf:', error);
            this.handleCriticalError(error);
        }
    }

    /**
     * Initialize core systems
     */
    async initializeCore() {
        // Initialize event management
        if (window.ToolShelf.EventManager) {
            console.log('📡 Event manager ready');
        }

        // Initialize utilities
        if (window.ToolShelf.Utils) {
            console.log('🛠️ Utilities ready');
        }

        // Set up navigation
        this.setupNavigation();

        console.log('🏗️ Core systems initialized');
    }

    /**
     * Initialize UI components
     */
    async initializeComponents() {
        // Initialize toast system
        if (window.ToolShelf.Toast) {
            const toastInitialized = window.ToolShelf.Toast.init();
            if (toastInitialized) {
                console.log('🍞 Toast system ready');
            }
        }

        // Initialize keyboard shortcuts
        if (window.ToolShelf.Keyboard) {
            window.ToolShelf.Keyboard.init();
            console.log('⌨️ Keyboard system ready');
        }

        // Initialize theme switcher
        if (window.ToolShelf.ThemeSwitcher) {
            window.ToolShelf.ThemeSwitcher.init();
            console.log('🎨 Theme switcher ready');
        }

        console.log('🎨 UI components initialized');
    }

    /**
     * Initialize all tools
     */
    async initializeTools() {
        try {
            // Initialize Text Transformer
            if (document.getElementById('text-transformer') && window.ToolShelf.TextTransformer) {
                const textTransformer = new window.ToolShelf.TextTransformer();
                this.registerTool('text-transformer', textTransformer);

                // Try to load previous state
                textTransformer.loadState();
            }

            console.log('🔧 Tools initialized');
        } catch (error) {
            console.error('❌ Tool initialization failed:', error);
            this.showToast('Some tools failed to load. Basic functionality available.', 'warning', 4000);
        }
    }

    /**
     * Set up navigation between tools
     */
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const toolId = e.currentTarget.getAttribute('data-tool');
                this.switchTool(toolId);
            });
        });

        console.log(`🧭 Navigation set up for ${navButtons.length} tools`);
    }

    /**
     * Set up global event handlers
     */
    setupGlobalEvents() {
        // Handle app visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.onAppHidden();
            } else {
                this.onAppVisible();
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', (e) => {
            this.onBeforeUnload(e);
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.onConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.onConnectionChange(false);
        });

        // Global error handling
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, 'Global error occurred');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason, 'Unhandled promise rejection');
            event.preventDefault();
        });

        console.log('🌐 Global event handlers set up');
    }

    /**
     * Finalize initialization
     */
    finalizeInitialization() {
        this.isInitialized = true;
        const initTime = Math.round(performance.now() - this.startTime);

        console.log(`✅ ToolShelf initialized successfully in ${initTime}ms`);

        // Show welcome message
        if (window.ToolShelf.Toast) {
            window.ToolShelf.Toast.success(
                `Welcome to ToolShelf! Loaded in ${initTime}ms`,
                3000
            );
        }

        // Log performance data
        this.logPerformanceData(initTime);
    }

    /**
     * Switch between tools with smooth transitions
     */
    switchTool(toolId) {
        if (toolId === this.currentTool) return;

        console.log(`🔄 Switching from ${this.currentTool} to ${toolId}`);

        // Notify current tool it's being hidden
        const currentTool = this.tools.get(this.currentTool);
        if (currentTool && typeof currentTool.onHide === 'function') {
            currentTool.onHide();
        }

        // Update navigation UI
        this.updateNavigation(toolId);

        // Update tool containers with smooth transition
        this.updateToolContainers(toolId);

        // Update current tool reference
        this.currentTool = toolId;

        // Notify new tool it's being shown
        const newTool = this.tools.get(toolId);
        if (newTool && typeof newTool.onShow === 'function') {
            newTool.onShow();
        }

        // Track tool usage
        this.trackToolUsage(toolId);
    }

    /**
     * Update navigation UI
     */
    updateNavigation(toolId) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.querySelector(`[data-tool="${toolId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    /**
     * Update tool containers with animation
     */
    updateToolContainers(toolId) {
        const currentContainer = document.querySelector('.tool-container.active');
        const newContainer = document.getElementById(toolId);

        if (currentContainer && newContainer && currentContainer !== newContainer) {
            // Smooth transition
            currentContainer.style.opacity = '0';

            setTimeout(() => {
                currentContainer.classList.remove('active');
                newContainer.classList.add('active');
                newContainer.style.opacity = '1';
            }, 150);
        }
    }

    /**
     * Register a tool with the app
     */
    registerTool(toolId, toolInstance) {
        this.tools.set(toolId, toolInstance);
        console.log(`📝 Tool registered: ${toolId}`);

        // Track tool registration
        this.trackEvent('tool_registered', { toolId });
    }

    /**
     * Get current tool instance
     */
    getCurrentTool() {
        return this.tools.get(this.currentTool);
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success', duration) {
        if (window.ToolShelf.Toast) {
            window.ToolShelf.Toast.show(message, type, duration);
        } else {
            console.log(`Toast: [${type}] ${message}`);
        }
    }

    /**
     * Handle global errors with comprehensive logging
     */
    handleGlobalError(error, context = 'Unknown error') {
        const errorData = window.ToolShelf.Utils.trackError(error, {
            context,
            currentTool: this.currentTool,
            timestamp: new Date().toISOString()
        });

        console.error('🚨 Global error:', errorData);
        this.showToast('An unexpected error occurred. The app should continue working.', 'error', 5000);

        // Track error for analytics
        this.trackEvent('error_occurred', {
            error: error.message,
            context,
            currentTool: this.currentTool
        });
    }

    /**
     * Handle critical errors that prevent app initialization
     */
    handleCriticalError(error) {
        console.error('💥 Critical error:', error);

        // Try to show error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; left: 20px; right: 20px;
            background: #fee; border: 2px solid #f66; color: #600;
            padding: 20px; border-radius: 8px; z-index: 9999;
            font-family: monospace; font-size: 14px;
        `;
        errorDiv.innerHTML = `
            <h3>⚠️ ToolShelf Failed to Initialize</h3>
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Please refresh the page. If the problem persists, check the browser console for details.</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px;">Reload Page</button>
        `;

        document.body.appendChild(errorDiv);
    }

    /**
     * Handle app visibility changes
     */
    onAppVisible() {
        console.log('👀 App became visible');
        this.trackEvent('app_visible');

        // Notify current tool
        const currentTool = this.getCurrentTool();
        if (currentTool && typeof currentTool.handleAppEvent === 'function') {
            currentTool.handleAppEvent('visible');
        }
    }

    /**
     * Handle app being hidden
     */
    onAppHidden() {
        console.log('🙈 App became hidden');
        this.trackEvent('app_hidden');

        // Notify current tool to save state
        const currentTool = this.getCurrentTool();
        if (currentTool && typeof currentTool.handleAppEvent === 'function') {
            currentTool.handleAppEvent('hidden');
        }
    }

    /**
     * Handle before page unload
     */
    onBeforeUnload(event) {
        console.log('👋 App unloading');

        // Notify all tools
        this.tools.forEach(tool => {
            if (typeof tool.handleAppEvent === 'function') {
                tool.handleAppEvent('beforeUnload');
            }
        });

        // Save app state
        this.saveAppState();
    }

    /**
     * Handle connection changes
     */
    onConnectionChange(isOnline) {
        console.log(`🌐 Connection: ${isOnline ? 'online' : 'offline'}`);

        const message = isOnline ?
            'Connection restored' :
            'Working offline - all features still available';

        this.showToast(message, isOnline ? 'success' : 'info', 3000);

        // Notify tools
        this.tools.forEach(tool => {
            if (typeof tool.handleAppEvent === 'function') {
                tool.handleAppEvent(isOnline ? 'online' : 'offline');
            }
        });
    }

    /**
     * Save application state
     */
    saveAppState() {
        try {
            const appState = {
                currentTool: this.currentTool,
                timestamp: new Date().toISOString(),
                version: window.ToolShelf.Constants.APP_VERSION
            };

            window.ToolShelf.Utils.storage.set('app_state', appState);
        } catch (error) {
            console.warn('Could not save app state:', error);
        }
    }

    /**
     * Load application state
     */
    loadAppState() {
        try {
            const appState = window.ToolShelf.Utils.storage.get('app_state');
            if (appState && appState.currentTool) {
                this.switchTool(appState.currentTool);
            }
        } catch (error) {
            console.warn('Could not load app state:', error);
        }
    }

    /**
     * Track events for analytics (placeholder)
     */
    trackEvent(eventName, data = {}) {
        // In a real app, this would send to analytics service
        console.log(`📊 Event: ${eventName}`, data);
    }

    /**
     * Track tool usage
     */
    trackToolUsage(toolId) {
        this.trackEvent('tool_switched', {
            toolId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log performance data
     */
    logPerformanceData(initTime) {
        if (window.performance && window.performance.getEntriesByType) {
            const perfData = window.performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('📊 Performance Metrics:', {
                    initTime: `${initTime}ms`,
                    domContentLoaded: `${Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart)}ms`,
                    loadComplete: `${Math.round(perfData.loadEventEnd - perfData.loadEventStart)}ms`,
                    totalTime: `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`
                });
            }
        }
    }

    /**
     * Get application statistics
     */
    getAppStats() {
        return {
            currentTool: this.currentTool,
            toolsRegistered: this.tools.size,
            isInitialized: this.isInitialized,
            uptime: Math.round((performance.now() - this.startTime) / 1000),
            version: window.ToolShelf.Constants.APP_VERSION,
            buildDate: window.ToolShelf.Constants.BUILD_DATE,
            isOnline: navigator.onLine,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get tool statistics
     */
    getToolStats() {
        const stats = {};

        this.tools.forEach((tool, toolId) => {
            if (typeof tool.getToolStats === 'function') {
                stats[toolId] = tool.getToolStats();
            } else {
                stats[toolId] = { available: true };
            }
        });

        return stats;
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, starting ToolShelf...');

    // Create global app instance
    window.app = new window.ToolShelf.App();

    // Make app accessible for debugging
    window.ToolShelf.instance = window.app;

    // Load previous app state after a short delay
    setTimeout(() => {
        if (window.app.isInitialized) {
            window.app.loadAppState();
        }
    }, 500);
});

// Additional global utilities
window.addEventListener('load', () => {
    // Final performance logging
    setTimeout(() => {
        if (window.app && window.app.isInitialized) {
            console.log('🎉 ToolShelf fully loaded and ready!');
            console.log('📊 App Stats:', window.app.getAppStats());
        }
    }, 100);
});