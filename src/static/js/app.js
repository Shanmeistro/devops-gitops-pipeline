// DevOps GitOps Demo App JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('DevOps GitOps Demo App loaded');
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Auto-refresh functionality
    const autoRefreshElements = document.querySelectorAll('[data-auto-refresh]');
    if (autoRefreshElements.length > 0) {
        startAutoRefresh();
    }
});

// Auto-refresh stats
function startAutoRefresh() {
    const refreshInterval = 5000; // 5 seconds
    
    setInterval(function() {
        updateStats();
    }, refreshInterval);
}

function updateStats() {
    fetch('/api/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateUIElements(data);
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
            showNotification('Failed to fetch updated stats', 'warning');
        });
}

function updateUIElements(data) {
    // Update uptime
    const uptimeElement = document.getElementById('uptime');
    if (uptimeElement && data.application) {
        const uptimeSeconds = Math.floor(data.application.uptime_seconds);
        const uptimeFormatted = formatUptime(uptimeSeconds);
        uptimeElement.textContent = uptimeFormatted;
    }
    
    // Update request count
    const requestsElement = document.getElementById('requests');
    if (requestsElement && data.application) {
        requestsElement.textContent = data.application.request_count;
    }
    
    // Update system metrics if available
    if (data.system) {
        updateProgressBars(data.system);
    }
}

function formatUptime(seconds) {
    if (seconds < 60) {
        return seconds + 's';
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return minutes + 'm ' + (seconds % 60) + 's';
    } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours + 'h ' + minutes + 'm';
    } else {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return days + 'd ' + hours + 'h';
    }
}

function updateProgressBars(systemData) {
    // Update CPU progress bar
    updateProgressBar('cpu', systemData.cpu_percent);
    
    // Update Memory progress bar
    updateProgressBar('memory', systemData.memory_percent);
    
    // Update Disk progress bar
    updateProgressBar('disk', systemData.disk_percent);
}

function updateProgressBar(type, percentage) {
    const progressBar = document.querySelector(`[data-metric="${type}"] .progress-bar`);
    if (progressBar) {
        progressBar.style.width = percentage + '%';
        
        // Update color based on percentage
        progressBar.className = 'progress-bar';
        if (percentage > 80) {
            progressBar.classList.add('bg-danger');
        } else if (percentage > 60) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-success');
        }
    }
    
    // Update percentage text
    const percentText = document.querySelector(`[data-metric="${type}"] .percentage-text`);
    if (percentText) {
        percentText.textContent = percentage.toFixed(1) + '%';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Health check functionality
function checkHealth() {
    fetch('/health')
        .then(response => response.json())
        .then(data => {
            const statusElement = document.getElementById('health-status');
            if (statusElement) {
                updateHealthStatus(statusElement, data);
            }
        })
        .catch(error => {
            console.error('Health check failed:', error);
        });
}

function updateHealthStatus(element, healthData) {
    element.innerHTML = '';
    
    const icon = document.createElement('i');
    const text = document.createElement('span');
    
    switch (healthData.status) {
        case 'healthy':
            icon.className = 'fas fa-check-circle text-success';
            text.textContent = 'Healthy';
            text.className = 'text-success ms-1';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle text-warning';
            text.textContent = 'Warning';
            text.className = 'text-warning ms-1';
            break;
        case 'unhealthy':
            icon.className = 'fas fa-times-circle text-danger';
            text.textContent = 'Unhealthy';
            text.className = 'text-danger ms-1';
            break;
        default:
            icon.className = 'fas fa-question-circle text-secondary';
            text.textContent = 'Unknown';
            text.className = 'text-secondary ms-1';
    }
    
    element.appendChild(icon);
    element.appendChild(text);
}

// Utility functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        showNotification('Copied to clipboard!', 'success');
    }, function(err) {
        console.error('Could not copy text: ', err);
        showNotification('Failed to copy to clipboard', 'danger');
    });
}

// Expose functions globally for inline event handlers
window.AppUtils = {
    copyToClipboard,
    checkHealth,
    showNotification
};
