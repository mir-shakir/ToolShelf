/**
 * ToolShelf Configuration Constants
 */
window.ToolShelf = window.ToolShelf || {};

window.ToolShelf.Constants = {
    // App metadata
    APP_NAME: 'ToolShelf',
    APP_VERSION: '1.0.0',
    BUILD_DATE: '2024-05-24',
    
    // Performance thresholds
    SLOW_OPERATION_THRESHOLD: 100, // milliseconds
    DEBOUNCE_DELAY: 100,
    TOAST_DEFAULT_DURATION: 3000,
    
    // Storage keys
    STORAGE_PREFIX: 'toolshelf_',
    ERROR_LOG_KEY: 'toolshelf_errors',
    USER_PREFERENCES_KEY: 'toolshelf_preferences',
    
    // Limits
    MAX_TEXT_LENGTH: 1000000, // 1MB of text
    MAX_LINES: 100000,
    MAX_ERRORS_STORED: 10,
    
    // Transform groups for conflict resolution
    TRANSFORM_GROUPS: {
        case: ['uppercase', 'lowercase', 'titlecase', 'sentencecase'],
        sort: ['sortLines', 'sortLinesDesc']
    },
    
    // Transform order for consistent application
    TRANSFORM_ORDER: [
        'trimWhitespace',
        'removeEmptyLines',
        'removeDuplicates',
        'sortLines',
        'sortLinesDesc',
        'reverseLines',
        'uppercase',
        'lowercase',
        'titlecase',
        'sentencecase',
        'reverse'
    ],
    
    // Display names for transforms
    TRANSFORM_DISPLAY_NAMES: {
        'uppercase': 'UPPERCASE',
        'lowercase': 'lowercase', 
        'titlecase': 'Title Case',
        'sentencecase': 'Sentence case',
        'reverse': 'Reverse',
        'removeDuplicates': 'Remove Duplicates',
        'trimWhitespace': 'Trim Whitespace',
        'removeEmptyLines': 'Remove Empty Lines',
        'sortLines': 'Sort A→Z',
        'sortLinesDesc': 'Sort Z→A',
        'reverseLines': 'Reverse Lines'
    },
    
    // Keyboard shortcuts
    KEYBOARD_SHORTCUTS: {
        'Ctrl+L': 'Clear input',
        'Ctrl+Enter': 'Copy output',
        'Ctrl+D': 'Download output',
        'Ctrl+R': 'Reset transformations',
        'Ctrl+K': 'Focus search',
        'Escape': 'Clear focus'
    },
    
    // Toast types
    TOAST_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        INFO: 'info',
        WARNING: 'warning'
    }
};