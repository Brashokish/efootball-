// API Service for eFootball League - Render Backend Version
class EFLAPI {
    constructor() {
        this.isOnline = true;
        this.backendUrl = 'https://efootball-backend-91me.onrender.com';
        console.log('✅ Using Render backend with Supabase');
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.backendUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.request('/api/health');
    }

    // Email reset
    async sendResetEmail(emailData) {
        return this.request('/api/send-reset-email', {
            method: 'POST',
            body: JSON.stringify(emailData)
        });
    }

    // Push notifications
    async saveSubscription(subscription) {
        return this.request('/api/save-subscription', {
            method: 'POST',
            body: JSON.stringify(subscription)
        });
    }

    async sendNotification(notificationData) {
        return this.request('/api/send-notification', {
            method: 'POST',
            body: JSON.stringify(notificationData)
        });
    }

    // Initialize league
    async initializeLeague() {
        return this.request('/api/initialize', {
            method: 'POST'
        });
    }
}

// Create global API instance
const eflAPI = new EFLAPI();

// Data Sync System for Supabase
class DataSync {
    constructor() {
        this.lastUpdate = localStorage.getItem('efl_last_sync') || null;
    }

    async manualSync() {
        showNotification('🔄 Refreshing data from Supabase...', 'info');
        
        try {
            await refreshAllDisplays();
            localStorage.setItem('efl_last_sync', new Date().toISOString());
            showNotification('✅ Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            showNotification('❌ Sync failed. Please try again.', 'error');
        }
    }
}

const dataSync = new DataSync();

// Connection status handler
function updateSyncStatus() {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) return;
    
    statusElement.innerHTML = '<i class="fas fa-cloud me-1"></i>Supabase + Render Online';
    statusElement.className = 'badge bg-success';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateSyncStatus();
    
    // Manual sync button
    const syncBtn = document.getElementById('manual-sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => dataSync.manualSync());
    }
    
    // Test backend connection
    eflAPI.healthCheck().then(health => {
        console.log('✅ Backend connection successful:', health);
    }).catch(err => {
        console.warn('⚠️ Backend connection failed:', err.message);
    });
});

// Keep your existing notification function
function showNotification(message, type = 'info') {
    const colors = {
        success: '#198754',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#0dcaf0'
    };

    const existing = document.getElementById('toast-temp');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'toast-temp';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #212529;
        color: #f8f9fa;
        border-left: 4px solid ${colors[type] || colors.info};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        z-index: 2000;
        min-width: 250px;
        font-size: 14px;
        transition: all 0.3s ease;
        opacity: 1;
    `;
    div.innerHTML = `<i class="fas fa-info-circle me-2" style="color:${colors[type]};"></i>${message}`;

    document.body.appendChild(div);

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-10px)';
        setTimeout(() => div.remove(), 300);
    }, 4000);
}
