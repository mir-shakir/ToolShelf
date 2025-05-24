/**
 * Main application controller
 * Handles navigation, tool switching, and global app functionality
 */
class MultiToolApp {
    constructor() {
        this.currentTool = 'text-transformer';
        this.tools = new Map();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupToast();
        this.initializeTools();
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
    }

    /**
     * Switch between different tools
     */
    switchTool(toolId) {
        if (toolId === this.currentTool) return;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${toolId}"]`).classList.add('active');

        // Update tool containers
        document.querySelectorAll('.tool-container').forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(toolId).classList.add('active');

        this.currentTool = toolId;

        // Initialize tool if not already done
        if (this.tools.has(toolId)) {
            this.tools.get(toolId).onShow?.();
        }
    }

    /**
     * Register a tool with the app
     */
    registerTool(toolId, toolInstance) {
        this.tools.set(toolId, toolInstance);
    }

    /**
     * Initialize all available tools
     */
    initializeTools() {
        // Initialize Text Transformer
        if (document.getElementById('text-transformer')) {
            const textTransformer = new TextTransformer();
            this.registerTool('text-transformer', textTransformer);
        }
    }

    /**
     * Set up toast notification system
     */
    setupToast() {
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    /**
     * Show a toast notification
     */
    showToast(message, type = 'success', duration = 3000) {
        this.toastMessage.textContent = message;
        
        // Update toast styling based on type
        this.toast.className = `toast ${type}`;
        
        // Show toast
        this.toast.classList.add('show');
        
        // Hide after duration
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, duration);
    }

    /**
     * Copy text to clipboard with fallback
     */
    async copyToClipboard(text) {
        try {
            // Modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } 
            // Fallback for older browsers
            else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return successful;
                } catch (err) {
                    document.body.removeChild(textArea);
                    throw err;
                }
            }
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    }

    /**
     * Utility method to debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Utility method to throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Handle errors gracefully
     */
    handleError(error, userMessage = 'An error occurred') {
        console.error('App Error:', error);
        this.showToast(userMessage, 'error');
    }

    /**
     * Get current tool instance
     */
    getCurrentTool() {
        return this.tools.get(this.currentTool);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MultiToolApp();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.app) {
        window.app.handleError(event.error, 'Something went wrong. Please try again.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.app) {
        window.app.handleError(event.reason, 'An unexpected error occurred.');
    }
});