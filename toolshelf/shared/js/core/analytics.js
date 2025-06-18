/**
 * ToolShelf Analytics - Simple client-side tracking
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.Analytics = {
    // Track events if gtag is available
    trackEvent(eventName, parameters = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }

        // Log for debugging
        console.log(`📊 Event: ${eventName}`, parameters);
    },

    // Track page views
    trackPageView(pageName, url = window.location.href) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: pageName,
                page_location: url
            });
        }

        console.log(`📄 Page view: ${pageName}`);
    },

    // Track tool usage
    trackToolUsage(toolName, action = 'use') {
        this.trackEvent('tool_usage', {
            tool_name: toolName,
            action: action,
            timestamp: new Date().toISOString()
        });
    },

    // Track performance metrics
    trackPerformance(metricName, value, unit = 'ms') {
        this.trackEvent('performance_metric', {
            metric_name: metricName,
            value: value,
            unit: unit
        });
    },

    // Track errors
    trackError(error, context = '') {
        this.trackEvent('error_occurred', {
            error_message: error.message || error,
            error_context: context,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
    },
    // ADD THESE NEW FUNCTIONS:

    // Initialize analytics for tool pages
    initToolPage() {
        const toolName = this.getToolNameFromPath();
        if (toolName) {
            this.trackToolUsage(toolName, 'page_view');
        }
        this.setupGlobalFunctions();
    },

    // Get tool name from current path
    getToolNameFromPath() {
        const path = window.location.pathname;
        if (path.includes('text-transformer')) return 'text_transformer';
        if (path.includes('base64-encoder')) return 'base64_encoder';
        // Add more tools as needed
        return null;
    },

    // Setup global functions for footer links
    setupGlobalFunctions() {
        window.showPrivacyInfo = () => this.showPrivacyInfo();
        window.showTermsInfo = () => this.showTermsInfo();
        window.showContactInfo = () => this.showContactInfo();
    },

    // Footer link handlers
    showPrivacyInfo() {
        alert('ToolShelf respects your privacy. All text processing happens locally in your browser. No data is collected or sent to any servers.');
        this.trackEvent('privacy_info_viewed');
    },

    showTermsInfo() {
        alert('ToolShelf is provided as-is for free use. Use responsibly and at your own risk.');
        this.trackEvent('terms_info_viewed');
    },

    showContactInfo() {
        alert('For questions or feedback, please visit our GitHub repository or create an issue.');
        this.trackEvent('contact_info_viewed');
    }
    
};

document.addEventListener('DOMContentLoaded', () => {
    window.ToolShelf.Analytics.initToolPage();
});
window.addEventListener('error', (event) => {
    if (window.ToolShelf && window.ToolShelf.Analytics) {
        window.ToolShelf.Analytics.trackError(event.error, 'global_error');
    }
});

