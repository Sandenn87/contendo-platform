// API client for ChronoAutoTee
class ApiClient {
    constructor() {
        this.baseUrl = window.location.origin;
        this.socket = null;
        this.init();
    }

    init() {
        // Initialize Socket.IO connection
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.showToast('Connected to server', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.showToast('Disconnected from server', 'warning');
        });

        this.socket.on('booking_update', (data) => {
            this.handleBookingUpdate(data);
        });

        this.socket.on('system_status', (data) => {
            this.handleSystemStatus(data);
        });

        this.socket.on('activity_log', (data) => {
            this.handleActivityLog(data);
        });
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error: ${endpoint}`, error);
            throw error;
        }
    }

    // System Status
    async getHealth() {
        return this.request('/health');
    }

    async getStatus() {
        return this.request('/status');
    }

    async getMetrics() {
        return this.request('/metrics');
    }

    // Configuration Management
    async getConfigurations() {
        return this.request('/api/configurations');
    }

    async getConfiguration(id) {
        return this.request(`/api/configurations/${id}`);
    }

    async createConfiguration(config) {
        return this.request('/api/configurations', {
            method: 'POST',
            body: config
        });
    }

    async updateConfiguration(id, config) {
        return this.request(`/api/configurations/${id}`, {
            method: 'PUT',
            body: config
        });
    }

    async deleteConfiguration(id) {
        return this.request(`/api/configurations/${id}`, {
            method: 'DELETE'
        });
    }

    async toggleConfiguration(id, active) {
        return this.request(`/api/configurations/${id}/toggle`, {
            method: 'POST',
            body: { active }
        });
    }

    // Course Management
    async searchCourses(query, authData) {
        return this.request('/api/courses/search', {
            method: 'POST',
            body: { query, authData }
        });
    }

    async getCourses() {
        return this.request('/api/courses');
    }

    async testConnection(authData) {
        return this.request('/api/auth/test', {
            method: 'POST',
            body: authData
        });
    }

    // Booking History
    async getBookingHistory(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/api/history?${params}`);
    }

    // Manual Actions
    async triggerCheck() {
        return this.request('/trigger', {
            method: 'POST'
        });
    }

    async pauseScheduler() {
        return this.request('/pause', {
            method: 'POST'
        });
    }

    async resumeScheduler() {
        return this.request('/resume', {
            method: 'POST'
        });
    }

    // Settings
    async getSettings() {
        return this.request('/api/settings');
    }

    async updateSettings(settings) {
        return this.request('/api/settings', {
            method: 'PUT',
            body: settings
        });
    }

    // Event Handlers
    handleBookingUpdate(data) {
        console.log('Booking update:', data);
        
        // Update UI based on booking status
        if (data.type === 'booking_success') {
            this.showToast(`Tee time booked successfully at ${data.courseName}!`, 'success');
            this.updateDashboardStats();
        } else if (data.type === 'booking_failed') {
            this.showToast(`Booking failed: ${data.error}`, 'error');
        } else if (data.type === 'availability_check') {
            this.addActivityItem(`Checked availability for ${data.courseName} - ${data.count} slots found`);
        }

        // Trigger UI refresh
        window.app?.refreshDashboard();
    }

    handleSystemStatus(data) {
        console.log('System status:', data);
        
        // Update health indicators
        const healthIndicator = document.getElementById('health-indicator');
        const systemStatus = document.getElementById('system-status');
        
        if (healthIndicator && systemStatus) {
            if (data.healthy) {
                healthIndicator.className = 'stat-icon status-indicator healthy';
                systemStatus.textContent = 'Healthy';
            } else {
                healthIndicator.className = 'stat-icon status-indicator unhealthy';
                systemStatus.textContent = 'Issues Detected';
            }
        }

        // Update next check time
        if (data.nextCheck) {
            const nextCheckElement = document.getElementById('next-check');
            if (nextCheckElement) {
                const time = new Date(data.nextCheck).toLocaleTimeString();
                nextCheckElement.textContent = time;
            }
        }
    }

    handleActivityLog(data) {
        console.log('Activity log:', data);
        this.addActivityItem(data.message, data.level);
    }

    addActivityItem(message, level = 'info') {
        const activityFeed = document.getElementById('activity-feed');
        if (!activityFeed) return;

        const item = document.createElement('div');
        item.className = 'activity-item';
        
        const icon = this.getActivityIcon(level);
        const time = new Date().toLocaleTimeString();
        
        item.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <small>${time}</small>
        `;

        // Add to top of feed
        if (activityFeed.firstChild) {
            activityFeed.insertBefore(item, activityFeed.firstChild);
        } else {
            activityFeed.appendChild(item);
        }

        // Limit to 50 items
        const items = activityFeed.children;
        if (items.length > 50) {
            activityFeed.removeChild(items[items.length - 1]);
        }
    }

    getActivityIcon(level) {
        switch (level) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-triangle';
            case 'warning': return 'fas fa-exclamation-circle';
            case 'booking': return 'fas fa-calendar-check';
            default: return 'fas fa-info-circle';
        }
    }

    async updateDashboardStats() {
        try {
            const [status, configurations, history] = await Promise.all([
                this.getStatus(),
                this.getConfigurations(),
                this.getBookingHistory({ limit: 100 })
            ]);

            // Update active bookings count
            const activeBookings = configurations.filter(c => c.isActive).length;
            const activeBookingsElement = document.getElementById('active-bookings');
            if (activeBookingsElement) {
                activeBookingsElement.textContent = activeBookings;
            }

            // Update successful bookings count
            const successfulBookings = history.filter(h => h.status === 'success').length;
            const successfulBookingsElement = document.getElementById('successful-bookings');
            if (successfulBookingsElement) {
                successfulBookingsElement.textContent = successfulBookings;
            }

        } catch (error) {
            console.error('Failed to update dashboard stats:', error);
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            ${message}
            <button class="toast-close">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);

        // Manual close
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
}

// Create global API client instance
window.api = new ApiClient();





