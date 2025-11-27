// Reusable UI components for ChronoAutoTee

// Empty state component
function createEmptyState(icon, title, description, actionButton) {
    return `
        <div class="empty-state" style="text-align: center; padding: 3rem; color: #64748b;">
            <i class="${icon}" style="font-size: 3rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
            <h3 style="color: #1e293b; margin-bottom: 0.5rem;">${title}</h3>
            <p style="margin-bottom: 2rem; max-width: 400px; margin-left: auto; margin-right: auto;">${description}</p>
            ${actionButton || ''}
        </div>
    `;
}

// Loading state component
function createLoadingState(message = 'Loading...') {
    return `
        <div class="loading-state" style="text-align: center; padding: 3rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #4f46e5; margin-bottom: 1rem;"></i>
            <p style="color: #64748b;">${message}</p>
        </div>
    `;
}

// Status badge component
function createStatusBadge(status, text) {
    const colors = {
        success: '#10b981',
        failed: '#ef4444',
        pending: '#f59e0b',
        cancelled: '#6b7280',
        active: '#10b981',
        paused: '#f59e0b',
        inactive: '#6b7280'
    };
    
    const color = colors[status] || colors.inactive;
    
    return `
        <span class="status-badge" style="
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.8rem;
            font-weight: 500;
            background-color: ${color}20;
            color: ${color};
        ">
            ${text || status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    `;
}

// Card component
function createCard(title, content, actions, headerIcon) {
    return `
        <div class="card" style="
            background: rgba(255, 255, 255, 0.9);
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        ">
            <div class="card-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            ">
                <h3 style="
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #1e293b;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                ">
                    ${headerIcon ? `<i class="${headerIcon}"></i>` : ''}
                    ${title}
                </h3>
            </div>
            <div class="card-content">
                ${content}
            </div>
            ${actions ? `
                <div class="card-actions" style="
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e2e8f0;
                ">
                    ${actions}
                </div>
            ` : ''}
        </div>
    `;
}

// Modal component
function createModal(id, title, content, size = 'medium') {
    const sizeClasses = {
        small: 'max-width: 400px;',
        medium: 'max-width: 600px;',
        large: 'max-width: 800px;',
        xlarge: 'max-width: 1000px;'
    };
    
    return `
        <div id="${id}" class="modal" style="
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 2000;
            overflow-y: auto;
        ">
            <div class="modal-overlay" style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100%;
                padding: 2rem;
            ">
                <div class="modal-content" style="
                    background: white;
                    border-radius: 1rem;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    ${sizeClasses[size]}
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: modalSlideIn 0.3s ease-out;
                ">
                    <div class="modal-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 2rem 2rem 1rem;
                        border-bottom: 1px solid #e2e8f0;
                    ">
                        <h2 style="
                            color: #1e293b;
                            margin: 0;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                        ">${title}</h2>
                        <button class="modal-close" onclick="closeModal('${id}')" style="
                            background: none;
                            border: none;
                            font-size: 1.5rem;
                            color: #64748b;
                            cursor: pointer;
                            padding: 0.5rem;
                            border-radius: 0.5rem;
                            transition: all 0.3s ease;
                        ">×</button>
                    </div>
                    <div class="modal-body" style="padding: 2rem;">
                        ${content}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Form field component
function createFormField(type, name, label, options = {}) {
    const {
        placeholder = '',
        required = false,
        value = '',
        help = '',
        options: selectOptions = [],
        className = '',
        disabled = false
    } = options;
    
    const requiredAttr = required ? 'required' : '';
    const disabledAttr = disabled ? 'disabled' : '';
    
    let input = '';
    
    switch (type) {
        case 'select':
            input = `
                <select name="${name}" id="${name}" ${requiredAttr} ${disabledAttr} class="${className}">
                    ${selectOptions.map(opt => 
                        `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
                    ).join('')}
                </select>
            `;
            break;
        case 'textarea':
            input = `<textarea name="${name}" id="${name}" placeholder="${placeholder}" ${requiredAttr} ${disabledAttr} class="${className}">${value}</textarea>`;
            break;
        case 'checkbox':
            input = `
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="checkbox" name="${name}" id="${name}" ${value ? 'checked' : ''} ${disabledAttr} class="${className}">
                    <span>${label}</span>
                </label>
            `;
            return `
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    ${input}
                    ${help ? `<p class="form-help" style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">${help}</p>` : ''}
                </div>
            `;
        default:
            input = `<input type="${type}" name="${name}" id="${name}" placeholder="${placeholder}" value="${value}" ${requiredAttr} ${disabledAttr} class="${className}">`;
    }
    
    return `
        <div class="form-group" style="margin-bottom: 1.5rem;">
            <label for="${name}" style="
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #1e293b;
            ">${label}</label>
            ${input}
            ${help ? `<p class="form-help" style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">${help}</p>` : ''}
        </div>
    `;
}

// Alert component
function createAlert(type, title, message, dismissible = true) {
    const colors = {
        success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
        error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
        warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
        info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
    };
    
    const color = colors[type] || colors.info;
    
    return `
        <div class="alert alert-${type}" style="
            background-color: ${color.bg};
            border-left: 4px solid ${color.border};
            color: ${color.text};
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
            position: relative;
        ">
            ${dismissible ? `
                <button onclick="this.parentElement.remove()" style="
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    background: none;
                    border: none;
                    color: ${color.text};
                    cursor: pointer;
                    font-size: 1.2rem;
                    opacity: 0.7;
                    transition: opacity 0.3s ease;
                " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
            ` : ''}
            ${title ? `<h4 style="margin: 0 0 0.5rem 0; font-weight: 600;">${title}</h4>` : ''}
            <p style="margin: 0;">${message}</p>
        </div>
    `;
}

// Progress bar component
function createProgressBar(percentage, label, color = '#4f46e5') {
    return `
        <div class="progress-container" style="margin-bottom: 1rem;">
            ${label ? `<label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #1e293b;">${label}</label>` : ''}
            <div class="progress-bar" style="
                background-color: #e2e8f0;
                border-radius: 0.5rem;
                height: 0.5rem;
                overflow: hidden;
                position: relative;
            ">
                <div class="progress-fill" style="
                    background-color: ${color};
                    height: 100%;
                    width: ${Math.max(0, Math.min(100, percentage))}%;
                    transition: width 0.3s ease;
                    border-radius: 0.5rem;
                "></div>
            </div>
            <div style="
                display: flex;
                justify-content: space-between;
                font-size: 0.8rem;
                color: #64748b;
                margin-top: 0.25rem;
            ">
                <span>0%</span>
                <span>${Math.round(percentage)}%</span>
                <span>100%</span>
            </div>
        </div>
    `;
}

// Table component
function createTable(headers, rows, options = {}) {
    const { 
        striped = true, 
        hover = true, 
        responsive = true,
        emptyMessage = 'No data available'
    } = options;
    
    const tableClass = `
        ${striped ? 'table-striped' : ''}
        ${hover ? 'table-hover' : ''}
    `.trim();
    
    const table = `
        <table class="table ${tableClass}" style="
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 0.5rem;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        ">
            <thead style="background-color: #f8fafc;">
                <tr>
                    ${headers.map(header => `
                        <th style="
                            padding: 1rem;
                            text-align: left;
                            font-weight: 600;
                            color: #1e293b;
                            border-bottom: 1px solid #e2e8f0;
                        ">${header}</th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.length > 0 ? rows.map((row, index) => `
                    <tr style="
                        ${striped && index % 2 === 1 ? 'background-color: #f8fafc;' : ''}
                        ${hover ? 'transition: background-color 0.2s ease;' : ''}
                    " ${hover ? `onmouseover="this.style.backgroundColor='#f1f5f9'" onmouseout="this.style.backgroundColor='${striped && index % 2 === 1 ? '#f8fafc' : 'transparent'}'"` : ''}>
                        ${row.map(cell => `
                            <td style="
                                padding: 1rem;
                                border-bottom: 1px solid #e2e8f0;
                                color: #374151;
                            ">${cell}</td>
                        `).join('')}
                    </tr>
                `).join('') : `
                    <tr>
                        <td colspan="${headers.length}" style="
                            padding: 2rem;
                            text-align: center;
                            color: #64748b;
                            font-style: italic;
                        ">${emptyMessage}</td>
                    </tr>
                `}
            </tbody>
        </table>
    `;
    
    return responsive ? `
        <div class="table-responsive" style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
            ${table}
        </div>
    ` : table;
}

// Utility functions for modal management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const firstInput = modal.querySelector('input, select, textarea, button');
        if (firstInput) {
            firstInput.focus();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal[style*="flex"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
});

// Export components to global scope
window.components = {
    createEmptyState,
    createLoadingState,
    createStatusBadge,
    createCard,
    createModal,
    createFormField,
    createAlert,
    createProgressBar,
    createTable,
    openModal,
    closeModal
};





