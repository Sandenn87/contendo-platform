// Utility functions for ChronoAutoTee

// Date formatting utilities
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatRelativeTime(date) {
    if (!date) return 'N/A';
    
    const now = new Date();
    const d = new Date(date);
    const diffMs = d - now;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (Math.abs(diffMins) < 1) {
        return 'Just now';
    } else if (Math.abs(diffMins) < 60) {
        return diffMins > 0 ? `In ${diffMins} minutes` : `${Math.abs(diffMins)} minutes ago`;
    } else if (Math.abs(diffHours) < 24) {
        return diffHours > 0 ? `In ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
    } else {
        return diffDays > 0 ? `In ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
    }
}

// Form validation utilities
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateTime(time) {
    const re = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return re.test(time);
}

function validateDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
}

function validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
}

// String utilities
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
}

function capitalizeFirst(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatCurrency(amount) {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Array utilities
function groupBy(array, keyFn) {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

function sortBy(array, keyFn, descending = false) {
    return array.sort((a, b) => {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        
        if (aVal < bVal) return descending ? 1 : -1;
        if (aVal > bVal) return descending ? -1 : 1;
        return 0;
    });
}

// Local storage utilities
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Failed to remove from localStorage:', error);
        return false;
    }
}

// DOM utilities
function createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    return element;
}

function addEventListenerSafe(element, event, handler) {
    if (element && typeof element.addEventListener === 'function') {
        element.addEventListener(event, handler);
        return true;
    }
    return false;
}

function removeEventListenerSafe(element, event, handler) {
    if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler);
        return true;
    }
    return false;
}

// Debounce utility
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Loading state utilities
function showLoading(element, text = 'Loading...') {
    if (!element) return;
    
    const originalContent = element.innerHTML;
    element.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>${text}</span>
        </div>
    `;
    element.dataset.originalContent = originalContent;
    element.disabled = true;
}

function hideLoading(element) {
    if (!element) return;
    
    const originalContent = element.dataset.originalContent;
    if (originalContent) {
        element.innerHTML = originalContent;
        delete element.dataset.originalContent;
    }
    element.disabled = false;
}

// Error handling utilities
function handleApiError(error, context = 'Operation') {
    console.error(`${context} failed:`, error);
    
    let message = `${context} failed`;
    if (error.message) {
        message += `: ${error.message}`;
    }
    
    if (window.api && typeof window.api.showToast === 'function') {
        window.api.showToast(message, 'error');
    } else {
        alert(message);
    }
}

// Color utilities for status indicators
function getStatusColor(status) {
    const colors = {
        success: '#10b981',
        failed: '#ef4444',
        pending: '#f59e0b',
        cancelled: '#6b7280',
        active: '#10b981',
        paused: '#f59e0b',
        inactive: '#6b7280'
    };
    
    return colors[status] || colors.inactive;
}

// Time zone utilities
function getUserTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function convertToUserTimezone(date, fromTimezone = 'UTC') {
    if (!date) return null;
    
    try {
        const d = new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            timeZone: getUserTimezone(),
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    } catch (error) {
        console.error('Failed to convert timezone:', error);
        return formatDateTime(date);
    }
}

// URL utilities
function updateUrlParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
}

function getUrlParam(name, defaultValue = null) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || defaultValue;
}

// Copy to clipboard utility
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        if (window.api && typeof window.api.showToast === 'function') {
            window.api.showToast('Copied to clipboard', 'success');
        }
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            if (window.api && typeof window.api.showToast === 'function') {
                window.api.showToast('Copied to clipboard', 'success');
            }
            return true;
        } catch (fallbackError) {
            console.error('Fallback copy failed:', fallbackError);
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// Export utilities to global scope
window.utils = {
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    validateEmail,
    validateTime,
    validateDate,
    validateDateRange,
    truncateText,
    capitalizeFirst,
    formatCurrency,
    groupBy,
    sortBy,
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    createElement,
    addEventListenerSafe,
    removeEventListenerSafe,
    debounce,
    throttle,
    showLoading,
    hideLoading,
    handleApiError,
    getStatusColor,
    getUserTimezone,
    convertToUserTimezone,
    updateUrlParams,
    getUrlParam,
    copyToClipboard
};





