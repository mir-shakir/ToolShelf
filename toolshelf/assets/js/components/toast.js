/**
 * ToolShelf Toast Notification System
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.Toast = {
    element: null,
    messageElement: null,
    queue: [],
    isShowing: false,
    currentType: 'success',
    
    init() {
        this.element = document.getElementById('toast');
        this.messageElement = document.getElementById('toastMessage');
        
        if (!this.element || !this.messageElement) {
            console.error('❌ Toast elements not found');
            return false;
        }
        
        // Set up close button
        const closeButton = this.element.querySelector('.toast-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hide());
        }
        
        console.log('🍞 Toast system initialized');
        return true;
    },
    
    /**
     * Show toast with queue support
     */
    show(message, type = 'success', duration = 3000) {
        const toastData = { message, type, duration };
        
        if (this.isShowing) {
            this.queue.push(toastData);
            return;
        }
        
        this.display(toastData);
    },
    
    /**
     * Display a single toast
     */
    display({ message, type, duration }) {
        if (!this.element || !this.messageElement) {
            console.warn('Toast not initialized');
            return;
        }
        
        this.isShowing = true;
        this.currentType = type;
        
        // Update content and styling
        this.messageElement.textContent = message;
        this.element.className = `toast ${type}`;
        
        // Update icon based on type
        const icon = this.element.querySelector('.toast-icon');
        if (icon) {
            icon.className = `toast-icon fas ${this.getIconClass(type)}`;
        }
        
        // Show toast
        this.element.classList.add('show');
        
        // Auto-hide after duration
        setTimeout(() => {
            this.hide();
        }, duration);
        
        console.log(`🍞 Toast shown: ${type} - ${message}`);
    },
    
    /**
     * Hide current toast
     */
    hide() {
        if (!this.element) return;
        
        this.element.classList.remove('show');
        
        setTimeout(() => {
            this.isShowing = false;
            
            // Show next toast in queue
            if (this.queue.length > 0) {
                const nextToast = this.queue.shift();
                this.display(nextToast);
            }
        }, 300); // Match CSS transition duration
    },
    
    /**
     * Get icon class for toast type
     */
    getIconClass(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.success;
    },
    
    /**
     * Convenience methods
     */
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    },
    
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        this.show(message, 'info', duration);
    },
    
    /**
     * Clear all queued toasts
     */
    clearQueue() {
        this.queue = [];
    },
    
    /**
     * Get queue length
     */
    getQueueLength() {
        return this.queue.length;
    }
};