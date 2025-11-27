// Main application controller
class ChronoAutoTeeApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentStep = 1;
        this.selectedCourse = null;
        this.editingConfigId = null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModal();
        this.setupConfigurationForm();
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateToPage(page);
            });
        });
    }

    navigateToPage(page) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // Show/hide pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}-page`).classList.add('active');

        this.currentPage = page;

        // Load page-specific data
        this.loadPageData(page);
    }

    async loadPageData(page) {
        try {
            switch (page) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'configurations':
                    await this.loadConfigurations();
                    break;
                case 'courses':
                    await this.loadCourses();
                    break;
                case 'history':
                    await this.loadHistory();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${page} data:`, error);
            api.showToast(`Failed to load ${page} data`, 'error');
        }
    }

    async loadDashboard() {
        try {
            await api.updateDashboardStats();
            
            // Load recent activity
            const history = await api.getBookingHistory({ limit: 10 });
            this.updateActivityFeed(history);
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    }

    updateActivityFeed(history) {
        const activityFeed = document.getElementById('activity-feed');
        if (!activityFeed) return;

        // Clear existing items except the first one (system started message)
        const firstItem = activityFeed.firstElementChild;
        activityFeed.innerHTML = '';
        if (firstItem) {
            activityFeed.appendChild(firstItem);
        }

        // Add history items
        history.forEach(item => {
            const message = this.formatHistoryMessage(item);
            const time = new Date(item.attemptedAt).toLocaleTimeString();
            
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <i class="${this.getHistoryIcon(item.status)}"></i>
                <span>${message}</span>
                <small>${time}</small>
            `;
            
            activityFeed.appendChild(activityItem);
        });
    }

    formatHistoryMessage(item) {
        const courseName = item.teeTime?.courseName || 'Unknown Course';
        const teeTime = item.teeTime ? `at ${item.teeTime.time}` : '';
        
        switch (item.status) {
            case 'success':
                return `Successfully booked tee time at ${courseName} ${teeTime}`;
            case 'failed':
                return `Failed to book tee time at ${courseName} - ${item.bookingResult.error || 'Unknown error'}`;
            case 'pending':
                return `Checking availability at ${courseName}`;
            default:
                return `Booking attempt at ${courseName}`;
        }
    }

    getHistoryIcon(status) {
        switch (status) {
            case 'success': return 'fas fa-check-circle';
            case 'failed': return 'fas fa-times-circle';
            case 'pending': return 'fas fa-clock';
            default: return 'fas fa-question-circle';
        }
    }

    async loadConfigurations() {
        try {
            const configurations = await api.getConfigurations();
            this.renderConfigurations(configurations);
        } catch (error) {
            console.error('Failed to load configurations:', error);
        }
    }

    renderConfigurations(configurations) {
        const grid = document.getElementById('configurations-grid');
        if (!grid) return;

        if (configurations.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>No booking configurations yet</h3>
                    <p>Create your first automated booking to get started</p>
                    <button class="btn btn-primary" onclick="app.openConfigurationModal()">
                        <i class="fas fa-plus"></i> Create Booking
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = configurations.map(config => `
            <div class="config-card">
                <div class="config-header">
                    <h3 class="config-title">${config.courseName}</h3>
                    <span class="config-status ${config.isActive ? 'active' : 'paused'}">
                        ${config.isActive ? 'Active' : 'Paused'}
                    </span>
                </div>
                <div class="config-details">
                    <div class="config-detail">
                        <span>Preferred Time:</span>
                        <strong>${config.preferredTime} (±${config.timeFlexibility}min)</strong>
                    </div>
                    <div class="config-detail">
                        <span>Party Size:</span>
                        <strong>${config.partySize} players</strong>
                    </div>
                    <div class="config-detail">
                        <span>Auth Type:</span>
                        <strong>${config.authType === 'partner_api' ? 'Partner API' : 'Web Login'}</strong>
                    </div>
                    <div class="config-detail">
                        <span>Date Range:</span>
                        <strong>${config.dateRange.start} to ${config.dateRange.end}</strong>
                    </div>
                </div>
                <div class="config-actions">
                    <button class="btn btn-secondary btn-small" onclick="app.editConfiguration('${config.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn ${config.isActive ? 'btn-secondary' : 'btn-primary'} btn-small" 
                            onclick="app.toggleConfiguration('${config.id}', ${!config.isActive})">
                        <i class="fas ${config.isActive ? 'fa-pause' : 'fa-play'}"></i> 
                        ${config.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button class="btn btn-outline btn-small" onclick="app.deleteConfiguration('${config.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadCourses() {
        try {
            const courses = await api.getCourses();
            this.renderCourses(courses);
        } catch (error) {
            console.error('Failed to load courses:', error);
        }
    }

    renderCourses(courses) {
        const grid = document.getElementById('courses-grid');
        if (!grid) return;

        if (courses.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No courses found</h3>
                    <p>Use the search above to find golf courses</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = courses.map(course => `
            <div class="course-card">
                <h3 class="course-name">${course.name}</h3>
                <p class="course-location">${course.location}</p>
                <div class="course-features">
                    ${course.supportedFeatures.walking ? '<span class="feature-tag">Walking</span>' : ''}
                    ${course.supportedFeatures.cart ? '<span class="feature-tag">Cart</span>' : ''}
                    ${course.supportedFeatures.holes9 ? '<span class="feature-tag">9 Holes</span>' : ''}
                    ${course.supportedFeatures.holes18 ? '<span class="feature-tag">18 Holes</span>' : ''}
                </div>
                <button class="btn btn-primary" onclick="app.selectCourseForBooking('${course.id}')">
                    <i class="fas fa-calendar-plus"></i> Create Booking
                </button>
            </div>
        `).join('');
    }

    async loadHistory() {
        try {
            const history = await api.getBookingHistory();
            this.renderHistory(history);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    renderHistory(history) {
        const tbody = document.getElementById('history-tbody');
        if (!tbody) return;

        if (history.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-history" style="font-size: 2rem; color: #64748b; margin-bottom: 1rem;"></i>
                        <br>No booking history yet
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = history.map(item => `
            <tr>
                <td>${new Date(item.attemptedAt).toLocaleDateString()}</td>
                <td>${item.teeTime?.courseName || 'Unknown'}</td>
                <td>${item.teeTime ? `${item.teeTime.date} ${item.teeTime.time}` : 'N/A'}</td>
                <td>
                    <span class="config-status ${item.status}">
                        ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                </td>
                <td>${item.bookingResult.message}</td>
            </tr>
        `).join('');
    }

    async loadSettings() {
        try {
            const settings = await api.getSettings();
            this.populateSettings(settings);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    populateSettings(settings) {
        // Populate form fields with current settings
        const fields = [
            'email-notifications',
            'notification-email',
            'pushover-notifications',
            'pushover-user-key',
            'pushover-app-token',
            'smtp-host',
            'smtp-port',
            'smtp-user',
            'smtp-pass',
            'default-polling-interval',
            'max-retries'
        ];

        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && settings[fieldId]) {
                if (element.type === 'checkbox') {
                    element.checked = settings[fieldId];
                } else {
                    element.value = settings[fieldId];
                }
            }
        });
    }

    setupModal() {
        const modal = document.getElementById('configuration-modal');
        const closeBtn = document.getElementById('modal-close-btn');
        const addBtn = document.getElementById('add-configuration-btn');

        addBtn?.addEventListener('click', () => this.openConfigurationModal());
        closeBtn?.addEventListener('click', () => this.closeConfigurationModal());

        // Close modal when clicking outside
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeConfigurationModal();
            }
        });
    }

    openConfigurationModal(configId = null) {
        const modal = document.getElementById('configuration-modal');
        const title = document.getElementById('modal-title');
        
        this.editingConfigId = configId;
        
        if (configId) {
            title.textContent = 'Edit Booking Configuration';
            this.loadConfigurationForEdit(configId);
        } else {
            title.textContent = 'New Booking Configuration';
            this.resetConfigurationForm();
        }
        
        modal.classList.add('active');
        this.currentStep = 1;
        this.showFormStep(1);
    }

    closeConfigurationModal() {
        const modal = document.getElementById('configuration-modal');
        modal.classList.remove('active');
        this.resetConfigurationForm();
        this.editingConfigId = null;
        this.selectedCourse = null;
    }

    async loadConfigurationForEdit(configId) {
        try {
            const config = await api.getConfiguration(configId);
            this.populateConfigurationForm(config);
        } catch (error) {
            console.error('Failed to load configuration:', error);
            api.showToast('Failed to load configuration', 'error');
        }
    }

    populateConfigurationForm(config) {
        // Populate form fields with configuration data
        document.querySelector(`input[name="authType"][value="${config.authType}"]`).checked = true;
        this.toggleAuthFields();
        
        if (config.authType === 'partner_api') {
            document.getElementById('api-token').value = config.credentials.partnerApiToken || '';
            document.getElementById('org-id').value = config.credentials.orgId || '';
            document.getElementById('facility-id').value = config.credentials.facilityId || '';
        } else {
            document.getElementById('chronogolf-email').value = config.credentials.email || '';
            document.getElementById('chronogolf-password').value = config.credentials.password || '';
        }

        // Course selection
        this.selectedCourse = { name: config.courseName, id: config.courseId };
        this.updateSelectedCourseDisplay();

        // Booking preferences
        document.getElementById('party-size').value = config.partySize;
        document.getElementById('preferred-time').value = config.preferredTime;
        document.getElementById('time-flexibility').value = config.timeFlexibility;
        document.getElementById('date-start').value = config.dateRange.start;
        document.getElementById('date-end').value = config.dateRange.end;
        document.getElementById('walking-cart').value = config.preferences.walkingOrCart;
        document.getElementById('holes').value = config.preferences.holes;
        document.getElementById('max-price').value = config.preferences.maxPrice || '';

        // Update player names
        this.updatePlayerNameFields(config.partySize);
        config.playerNames.forEach((name, index) => {
            const input = document.querySelectorAll('.player-name')[index];
            if (input) input.value = name;
        });

        // Days of week
        config.daysOfWeek.forEach(day => {
            const checkbox = document.querySelector(`input[value="${day}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // System settings
        document.getElementById('polling-interval').value = config.polling.intervalSeconds;
        document.getElementById('max-retries-config').value = config.polling.maxRetries;

        // Release monitoring
        if (config.teeTimeReleaseSchedule?.enabled) {
            document.getElementById('enable-release-monitoring').checked = true;
            document.getElementById('release-time').value = config.teeTimeReleaseSchedule.releaseTime;
            document.getElementById('release-days').value = config.teeTimeReleaseSchedule.releaseDays;
            this.toggleReleaseSettings();
        }
    }

    resetConfigurationForm() {
        document.getElementById('configuration-form').reset();
        this.selectedCourse = null;
        this.currentStep = 1;
        this.updateSelectedCourseDisplay();
        this.updatePlayerNameFields(4);
        this.toggleAuthFields();
        this.toggleReleaseSettings();
    }

    setupConfigurationForm() {
        const form = document.getElementById('configuration-form');
        const nextBtn = document.getElementById('next-step-btn');
        const prevBtn = document.getElementById('prev-step-btn');
        const saveBtn = document.getElementById('save-configuration-btn');

        // Auth type toggle
        document.querySelectorAll('input[name="authType"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleAuthFields());
        });

        // Party size change
        document.getElementById('party-size')?.addEventListener('change', (e) => {
            this.updatePlayerNameFields(parseInt(e.target.value));
        });

        // Time flexibility slider
        const flexibilitySlider = document.getElementById('time-flexibility');
        flexibilitySlider?.addEventListener('input', (e) => {
            document.getElementById('flexibility-value').textContent = `${e.target.value} minutes`;
        });

        // Release monitoring toggle
        document.getElementById('enable-release-monitoring')?.addEventListener('change', () => {
            this.toggleReleaseSettings();
        });

        // Course search
        document.getElementById('test-connection-btn')?.addEventListener('click', () => {
            this.searchCourses();
        });

        // Step navigation
        nextBtn?.addEventListener('click', () => this.nextStep());
        prevBtn?.addEventListener('click', () => this.prevStep());
        saveBtn?.addEventListener('click', () => this.saveConfiguration());

        // Form submission
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveConfiguration();
        });
    }

    toggleAuthFields() {
        const authType = document.querySelector('input[name="authType"]:checked')?.value;
        const partnerApiFields = document.getElementById('partner-api-fields');
        const webAuthFields = document.getElementById('web-auth-fields');

        if (authType === 'partner_api') {
            partnerApiFields.style.display = 'block';
            webAuthFields.style.display = 'none';
        } else {
            partnerApiFields.style.display = 'none';
            webAuthFields.style.display = 'block';
        }
    }

    updatePlayerNameFields(partySize) {
        const container = document.getElementById('player-names-container');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 1; i <= partySize; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'player-name';
            input.placeholder = `Player ${i} Name`;
            input.required = i === 1; // First player name is required
            container.appendChild(input);
        }
    }

    toggleReleaseSettings() {
        const checkbox = document.getElementById('enable-release-monitoring');
        const settings = document.getElementById('release-settings');
        
        if (checkbox?.checked) {
            settings.style.display = 'block';
        } else {
            settings.style.display = 'none';
        }
    }

    async searchCourses() {
        const query = document.getElementById('course-search-input')?.value;
        if (!query) {
            api.showToast('Please enter a course name to search', 'warning');
            return;
        }

        const authData = this.collectAuthData();
        if (!authData) {
            api.showToast('Please configure authentication first', 'warning');
            return;
        }

        try {
            const button = document.getElementById('test-connection-btn');
            button.textContent = 'Searching...';
            button.disabled = true;

            const courses = await api.searchCourses(query, authData);
            this.displayCourseResults(courses);

        } catch (error) {
            console.error('Course search failed:', error);
            api.showToast('Course search failed: ' + error.message, 'error');
        } finally {
            const button = document.getElementById('test-connection-btn');
            button.textContent = 'Search Courses';
            button.disabled = false;
        }
    }

    collectAuthData() {
        const authType = document.querySelector('input[name="authType"]:checked')?.value;
        
        if (authType === 'partner_api') {
            const token = document.getElementById('api-token')?.value;
            const orgId = document.getElementById('org-id')?.value;
            const facilityId = document.getElementById('facility-id')?.value;
            
            if (!token || !orgId || !facilityId) return null;
            
            return {
                type: 'partner_api',
                token,
                orgId,
                facilityId
            };
        } else {
            const email = document.getElementById('chronogolf-email')?.value;
            const password = document.getElementById('chronogolf-password')?.value;
            
            if (!email || !password) return null;
            
            return {
                type: 'web',
                email,
                password
            };
        }
    }

    displayCourseResults(courses) {
        const resultsContainer = document.getElementById('course-results');
        if (!resultsContainer) return;

        if (courses.length === 0) {
            resultsContainer.innerHTML = '<div class="course-result-item">No courses found matching your search.</div>';
        } else {
            resultsContainer.innerHTML = courses.map(course => `
                <div class="course-result-item" onclick="app.selectCourse('${course.id}', '${course.name}', '${course.location}')">
                    <strong>${course.name}</strong>
                    <br>
                    <small>${course.location}</small>
                </div>
            `).join('');
        }

        resultsContainer.classList.add('active');
    }

    selectCourse(id, name, location) {
        this.selectedCourse = { id, name, location };
        this.updateSelectedCourseDisplay();
        
        // Hide search results
        const resultsContainer = document.getElementById('course-results');
        resultsContainer?.classList.remove('active');
    }

    updateSelectedCourseDisplay() {
        const selectedCourseInfo = document.getElementById('selected-course-info');
        const courseName = document.getElementById('selected-course-name');
        const courseLocation = document.getElementById('selected-course-location');

        if (this.selectedCourse) {
            selectedCourseInfo.style.display = 'block';
            courseName.textContent = this.selectedCourse.name;
            courseLocation.textContent = this.selectedCourse.location;
        } else {
            selectedCourseInfo.style.display = 'none';
        }
    }

    selectCourseForBooking(courseId) {
        // This would open the configuration modal with the course pre-selected
        this.openConfigurationModal();
        // In a real implementation, you'd load the course details and pre-populate
    }

    showFormStep(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.step-indicator').forEach(s => {
            s.classList.remove('active', 'completed');
        });

        // Show current step
        document.querySelector(`[data-step="${step}"]`).classList.add('active');
        document.querySelector(`.step-indicator[data-step="${step}"]`).classList.add('active');

        // Mark previous steps as completed
        for (let i = 1; i < step; i++) {
            document.querySelector(`.step-indicator[data-step="${i}"]`).classList.add('completed');
        }

        // Update navigation buttons
        const prevBtn = document.getElementById('prev-step-btn');
        const nextBtn = document.getElementById('next-step-btn');
        const saveBtn = document.getElementById('save-configuration-btn');

        prevBtn.style.display = step > 1 ? 'block' : 'none';
        
        if (step < 4) {
            nextBtn.style.display = 'block';
            saveBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'none';
            saveBtn.style.display = 'block';
        }

        this.currentStep = step;
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            this.showFormStep(this.currentStep + 1);
        }
    }

    prevStep() {
        this.showFormStep(this.currentStep - 1);
    }

    validateCurrentStep() {
        // Basic validation for each step
        switch (this.currentStep) {
            case 1:
                const authType = document.querySelector('input[name="authType"]:checked')?.value;
                if (authType === 'partner_api') {
                    const token = document.getElementById('api-token')?.value;
                    if (!token) {
                        api.showToast('Please enter your API token', 'warning');
                        return false;
                    }
                } else {
                    const email = document.getElementById('chronogolf-email')?.value;
                    const password = document.getElementById('chronogolf-password')?.value;
                    if (!email || !password) {
                        api.showToast('Please enter your Chronogolf credentials', 'warning');
                        return false;
                    }
                }
                break;
            case 2:
                if (!this.selectedCourse) {
                    api.showToast('Please select a golf course', 'warning');
                    return false;
                }
                break;
            case 3:
                const preferredTime = document.getElementById('preferred-time')?.value;
                const dateStart = document.getElementById('date-start')?.value;
                const dateEnd = document.getElementById('date-end')?.value;
                if (!preferredTime || !dateStart || !dateEnd) {
                    api.showToast('Please fill in all required booking preferences', 'warning');
                    return false;
                }
                break;
        }
        return true;
    }

    async saveConfiguration() {
        if (!this.validateCurrentStep()) {
            return;
        }

        try {
            const config = this.collectConfigurationData();
            
            if (this.editingConfigId) {
                await api.updateConfiguration(this.editingConfigId, config);
                api.showToast('Configuration updated successfully', 'success');
            } else {
                await api.createConfiguration(config);
                api.showToast('Configuration created successfully', 'success');
            }

            this.closeConfigurationModal();
            
            // Refresh configurations page if currently viewing
            if (this.currentPage === 'configurations') {
                await this.loadConfigurations();
            }

        } catch (error) {
            console.error('Failed to save configuration:', error);
            api.showToast('Failed to save configuration: ' + error.message, 'error');
        }
    }

    collectConfigurationData() {
        const authType = document.querySelector('input[name="authType"]:checked')?.value;
        
        // Collect credentials
        const credentials = {};
        if (authType === 'partner_api') {
            credentials.partnerApiToken = document.getElementById('api-token')?.value;
            credentials.orgId = document.getElementById('org-id')?.value;
            credentials.facilityId = document.getElementById('facility-id')?.value;
            credentials.courseId = this.selectedCourse?.id;
        } else {
            credentials.email = document.getElementById('chronogolf-email')?.value;
            credentials.password = document.getElementById('chronogolf-password')?.value;
        }

        // Collect player names
        const playerNames = Array.from(document.querySelectorAll('.player-name'))
            .map(input => input.value)
            .filter(name => name.trim() !== '');

        // Collect days of week
        const daysOfWeek = Array.from(document.querySelectorAll('.day-checkbox input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        // Build configuration object
        const config = {
            courseName: this.selectedCourse?.name,
            courseId: this.selectedCourse?.id,
            authType,
            credentials,
            partySize: parseInt(document.getElementById('party-size')?.value),
            playerNames,
            preferredTime: document.getElementById('preferred-time')?.value,
            timeFlexibility: parseInt(document.getElementById('time-flexibility')?.value),
            dateRange: {
                start: document.getElementById('date-start')?.value,
                end: document.getElementById('date-end')?.value
            },
            daysOfWeek,
            preferences: {
                walkingOrCart: document.getElementById('walking-cart')?.value,
                holes: document.getElementById('holes')?.value === 'either' ? 'either' : parseInt(document.getElementById('holes')?.value),
                maxPrice: document.getElementById('max-price')?.value ? parseFloat(document.getElementById('max-price')?.value) : undefined
            },
            polling: {
                enabled: true,
                intervalSeconds: parseInt(document.getElementById('polling-interval')?.value),
                maxRetries: parseInt(document.getElementById('max-retries-config')?.value)
            },
            notifications: {
                email: {
                    enabled: document.getElementById('enable-email-notifications')?.checked || false,
                    address: '' // Will be populated from global settings
                },
                pushover: {
                    enabled: document.getElementById('enable-pushover-notifications')?.checked || false
                }
            },
            isActive: true
        };

        // Add release schedule if enabled
        if (document.getElementById('enable-release-monitoring')?.checked) {
            config.teeTimeReleaseSchedule = {
                enabled: true,
                releaseTime: document.getElementById('release-time')?.value,
                releaseDays: parseInt(document.getElementById('release-days')?.value),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        }

        return config;
    }

    async editConfiguration(configId) {
        this.openConfigurationModal(configId);
    }

    async toggleConfiguration(configId, active) {
        try {
            await api.toggleConfiguration(configId, active);
            api.showToast(`Configuration ${active ? 'activated' : 'paused'}`, 'success');
            await this.loadConfigurations();
        } catch (error) {
            console.error('Failed to toggle configuration:', error);
            api.showToast('Failed to update configuration', 'error');
        }
    }

    async deleteConfiguration(configId) {
        if (!confirm('Are you sure you want to delete this configuration?')) {
            return;
        }

        try {
            await api.deleteConfiguration(configId);
            api.showToast('Configuration deleted', 'success');
            await this.loadConfigurations();
        } catch (error) {
            console.error('Failed to delete configuration:', error);
            api.showToast('Failed to delete configuration', 'error');
        }
    }

    setupEventListeners() {
        // Settings save button
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            this.saveSettings();
        });

        // Manual trigger button (if exists)
        document.getElementById('trigger-check-btn')?.addEventListener('click', () => {
            this.triggerManualCheck();
        });
    }

    async saveSettings() {
        try {
            const settings = this.collectSettingsData();
            await api.updateSettings(settings);
            api.showToast('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            api.showToast('Failed to save settings', 'error');
        }
    }

    collectSettingsData() {
        return {
            emailNotifications: document.getElementById('email-notifications')?.checked,
            notificationEmail: document.getElementById('notification-email')?.value,
            pushoverNotifications: document.getElementById('pushover-notifications')?.checked,
            pushoverUserKey: document.getElementById('pushover-user-key')?.value,
            pushoverAppToken: document.getElementById('pushover-app-token')?.value,
            smtpHost: document.getElementById('smtp-host')?.value,
            smtpPort: parseInt(document.getElementById('smtp-port')?.value),
            smtpUser: document.getElementById('smtp-user')?.value,
            smtpPass: document.getElementById('smtp-pass')?.value,
            defaultPollingInterval: parseInt(document.getElementById('default-polling-interval')?.value),
            maxRetries: parseInt(document.getElementById('max-retries')?.value)
        };
    }

    async triggerManualCheck() {
        try {
            await api.triggerCheck();
            api.showToast('Manual check triggered', 'success');
        } catch (error) {
            console.error('Failed to trigger check:', error);
            api.showToast('Failed to trigger check', 'error');
        }
    }

    async loadInitialData() {
        // Load dashboard by default
        await this.loadDashboard();
    }

    async refreshDashboard() {
        if (this.currentPage === 'dashboard') {
            await this.loadDashboard();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChronoAutoTeeApp();
});





