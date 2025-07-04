/**
 * ToolShelf Theme Switcher Component - Global light/dark mode switcher
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.ThemeSwitcher = {
    currentTheme: 'light',
    themeSwitcherBtn: null,
    isInitialized: false,
    
    /**
     * Initialize theme switcher functionality
     */
    init() {
        if (this.isInitialized) return true;

        this.themeSwitcherBtn = document.getElementById('themeSwitcherBtn');
        
        if (!this.themeSwitcherBtn) {
            console.warn('⚠️ Theme switcher button not found');
            return false;
        }

        // Load saved theme or detect system preference
        this.loadTheme();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update button state
        this.updateButton();
        
        this.isInitialized = true;
        console.log('🎨 Theme switcher initialized');
        return true;
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Theme switcher button click
        this.themeSwitcherBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleTheme();
        });

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a theme
                if (!this.hasManuallySetTheme()) {
                    this.setTheme(e.matches ? 'dark' : 'light', false);
                }
            });
        }
    },

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme, true);
        
        // Track theme change for analytics
        if (window.ToolShelf && window.ToolShelf.Utils) {
            window.ToolShelf.Utils.trackEvent?.('theme_switched', { 
                from: this.currentTheme === 'light' ? 'dark' : 'light',
                to: newTheme 
            });
        }
    },

    /**
     * Set theme
     */
    setTheme(theme, savePreference = true) {
        this.currentTheme = theme;
        
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        
        // Save preference if requested
        if (savePreference) {
            this.saveTheme(theme);
        }
        
        // Update button state
        this.updateButton();
        
        console.log(`🎨 Theme switched to ${theme}`);
    },

    /**
     * Load saved theme or detect system preference
     */
    loadTheme() {
        try {
            // First check for saved preference
            const savedTheme = localStorage.getItem('toolshelf-theme');
            
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                this.setTheme(savedTheme, false);
                return;
            }
            
            // Fall back to system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.setTheme('dark', false);
            } else {
                this.setTheme('light', false);
            }
        } catch (error) {
            console.warn('Could not load theme preference:', error);
            this.setTheme('light', false);
        }
    },

    /**
     * Save theme preference
     */
    saveTheme(theme) {
        try {
            localStorage.setItem('toolshelf-theme', theme);
            localStorage.setItem('toolshelf-theme-timestamp', Date.now().toString());
        } catch (error) {
            console.warn('Could not save theme preference:', error);
        }
    },

    /**
     * Check if user has manually set a theme
     */
    hasManuallySetTheme() {
        try {
            return localStorage.getItem('toolshelf-theme') !== null;
        } catch (error) {
            return false;
        }
    },

    /**
     * Update button appearance and accessibility
     */
    updateButton() {
        if (!this.themeSwitcherBtn) return;

        const icon = this.themeSwitcherBtn.querySelector('i');
        const isDark = this.currentTheme === 'dark';
        
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Update button title and aria-label
        const newTitle = isDark ? 'Switch to light mode' : 'Switch to dark mode';
        this.themeSwitcherBtn.title = newTitle;
        this.themeSwitcherBtn.setAttribute('aria-label', newTitle);
    },

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    },

    /**
     * Check if current theme is dark
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    },

    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.themeSwitcherBtn) {
            this.themeSwitcherBtn.removeEventListener('click', this.toggleTheme);
        }
        this.isInitialized = false;
    }
};

// Auto-initialize theme as early as possible to prevent FOUC (Flash of Unstyled Content)
(function() {
    'use strict';
    
    // Apply theme immediately based on saved preference or system setting
    function applyInitialTheme() {
        try {
            const savedTheme = localStorage.getItem('toolshelf-theme');
            
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
                document.documentElement.setAttribute('data-theme', savedTheme);
                return;
            }
            
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        } catch (error) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
    
    // Apply theme immediately
    if (document.readyState === 'loading') {
        applyInitialTheme();
    } else {
        applyInitialTheme();
    }
})();