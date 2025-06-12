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
    }
};