// API Service for eFootball League - Supabase Version
class EFLAPI {
    constructor() {
        this.isOnline = true; // Supabase is always online
        console.log('✅ Using Supabase as backend');
    }

    // All data operations now handled directly by Supabase client in database.js
    // This file can be removed or kept for future external API integrations
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
    
    statusElement.innerHTML = '<i class="fas fa-cloud me-1"></i>Supabase Online';
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