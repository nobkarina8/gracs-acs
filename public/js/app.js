// ===== Global State =====
let currentUser = null;
let authToken = null;

// API Base URL
const API_BASE = window.location.origin + '/api';

// ===== API Client =====
async function apiRequest(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== Screen Management =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewId.replace('-view', '')}"]`)?.classList.add('active');

    // Load data for the view
    loadViewData(viewId);
}

function loadViewData(viewId) {
    switch (viewId) {
        case 'dashboard-view':
            loadDashboard();
            break;
        case 'devices-view':
            loadDevices();
            break;
        case 'tasks-view':
            loadTasks();
            break;
        case 'logs-view':
            loadLogs();
            break;
    }
}

// ===== Dashboard Functions =====
async function loadDashboard() {
    try {
        // Load statistics
        const deviceStats = await apiRequest('/devices/statistics');
        const taskStats = await apiRequest('/tasks/statistics');

        // Update stats cards
        document.getElementById('stat-total-devices').textContent =
            deviceStats.data.total_devices || 0;
        document.getElementById('stat-online-devices').textContent =
            deviceStats.data.online_devices || 0;
        document.getElementById('stat-offline-devices').textContent =
            deviceStats.data.offline_devices || 0;
        document.getElementById('stat-pending-tasks').textContent =
            taskStats.data.pending_tasks || 0;

        // Load recent activity
        await loadRecentLogs();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

async function loadRecentLogs() {
    try {
        const response = await apiRequest('/logs/recent');
        const logs = response.data || [];

        const activityList = document.getElementById('recent-activity');

        if (logs.length === 0) {
            activityList.innerHTML = '<div class="loading">No recent activity</div>';
            return;
        }

        activityList.innerHTML = logs.slice(0, 10).map(log => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${getSeverityColor(log.severity)}">
                    ${getSeverityIcon(log.severity)}
                </div>
                <div class="activity-content">
                    <div class="activity-message">${escapeHtml(log.message)}</div>
                    <div class="activity-time">${formatTime(log.timestamp)}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load recent logs:', error);
        document.getElementById('recent-activity').innerHTML =
            '<div class="loading">Failed to load activity</div>';
    }
}

// ===== Helper Functions =====
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getSeverityColor(severity) {
    const colors = {
        debug: 'rgba(156, 163, 175, 0.15)',
        info: 'rgba(59, 130, 246, 0.15)',
        warning: 'rgba(245, 158, 11, 0.15)',
        error: 'rgba(239, 68, 68, 0.15)',
        critical: 'rgba(239, 68, 68, 0.25)',
    };
    return colors[severity] || colors.info;
}

function getSeverityIcon(severity) {
    const icons = {
        debug: '🔍',
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        critical: '🚨',
    };
    return icons[severity] || icons.info;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing session
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showScreen('login-screen');
    }

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = e.target.dataset.view + '-view';
            showView(viewId);
        });
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        logout();
    });
});

function showDashboard() {
    document.getElementById('user-name').textContent = currentUser.username;
    showScreen('dashboard-screen');
    loadDashboard();
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showScreen('login-screen');
}

// Auto-refresh dashboard every 30 seconds
setInterval(() => {
    const activeView = document.querySelector('.view.active');
    if (activeView && activeView.id === 'dashboard-view') {
        loadDashboard();
    }
}, 30000);
