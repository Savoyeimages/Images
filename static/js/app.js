// WebSocket connection
const socket = io();

// State management
const state = {
    downloads: {},
    currentTab: 'active',
    defaultPath: ''
};

// DOM elements
const urlInput = document.getElementById('url-input');
const formatSelect = document.getElementById('format-select');
const pathInput = document.getElementById('path-input');
const downloadBtn = document.getElementById('download-btn');
const downloadsContainer = document.getElementById('downloads-container');
const tabs = document.querySelectorAll('.tab');
const activeCount = document.getElementById('active-count');
const completedCount = document.getElementById('completed-count');
const failedCount = document.getElementById('failed-count');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadDownloadPath();
    loadExistingDownloads();
});

// Event Listeners
function setupEventListeners() {
    downloadBtn.addEventListener('click', handleDownload);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleDownload();
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
}

// WebSocket Events
socket.on('connect', () => {
    console.log('Connected to server');
    showNotification('Connected', 'Successfully connected to server', 'success');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showNotification('Disconnected', 'Lost connection to server', 'error');
});

socket.on('queue_update', (data) => {
    console.log('Queue update:', data);
    data.downloads.forEach(download => {
        state.downloads[download.id] = download;
    });
    renderDownloads();
});

socket.on('download_progress', (data) => {
    console.log('Progress update:', data);
    state.downloads[data.download_id] = data.data;
    updateDownloadItem(data.download_id, data.data);
    updateStats();
});

socket.on('download_complete', (data) => {
    console.log('Download complete:', data);
    state.downloads[data.download_id] = data.data;
    updateDownloadItem(data.download_id, data.data);
    updateStats();
    showNotification(
        'Download Complete',
        `${data.data.title || 'Video'} has been downloaded successfully`,
        'success'
    );
});

socket.on('download_failed', (data) => {
    console.log('Download failed:', data);
    state.downloads[data.download_id] = data.data;
    updateDownloadItem(data.download_id, data.data);
    updateStats();
    showNotification(
        'Download Failed',
        `Failed to download: ${data.data.error}`,
        'error'
    );
});

socket.on('download_removed', (data) => {
    delete state.downloads[data.download_id];
    renderDownloads();
    updateStats();
});

// API Functions
async function loadDownloadPath() {
    try {
        const response = await fetch('/api/settings/download-path');
        const data = await response.json();
        state.defaultPath = data.path;
        pathInput.value = data.path;
        pathInput.placeholder = data.path;
    } catch (error) {
        console.error('Failed to load download path:', error);
    }
}

async function loadExistingDownloads() {
    try {
        const response = await fetch('/api/downloads');
        const data = await response.json();
        data.downloads.forEach(download => {
            state.downloads[download.id] = download;
        });
        renderDownloads();
        updateStats();
    } catch (error) {
        console.error('Failed to load downloads:', error);
    }
}

async function handleDownload() {
    const url = urlInput.value.trim();

    if (!url) {
        showNotification('Error', 'Please enter a valid URL', 'error');
        return;
    }

    // Basic URL validation
    try {
        new URL(url);
    } catch (e) {
        showNotification('Error', 'Please enter a valid URL', 'error');
        return;
    }

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span>⏳ Starting...</span>';

    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                format: formatSelect.value,
                output_path: pathInput.value || state.defaultPath
            })
        });

        if (!response.ok) {
            throw new Error('Failed to start download');
        }

        const data = await response.json();
        state.downloads[data.download_id] = data.data;

        urlInput.value = '';
        renderDownloads();
        updateStats();
        showNotification('Download Started', 'Your download has been queued', 'success');

    } catch (error) {
        console.error('Download error:', error);
        showNotification('Error', 'Failed to start download', 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span>⬇️ Download</span>';
    }
}

async function removeDownload(downloadId) {
    try {
        const response = await fetch(`/api/download/${downloadId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to remove download');
        }

        delete state.downloads[downloadId];
        renderDownloads();
        updateStats();

    } catch (error) {
        console.error('Remove error:', error);
        showNotification('Error', 'Failed to remove download', 'error');
    }
}

// UI Functions
function switchTab(tabName) {
    state.currentTab = tabName;

    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    renderDownloads();
}

function renderDownloads() {
    const filteredDownloads = Object.values(state.downloads).filter(download => {
        switch (state.currentTab) {
            case 'active':
                return download.status === 'pending' || download.status === 'downloading';
            case 'completed':
                return download.status === 'completed';
            case 'failed':
                return download.status === 'failed';
            case 'all':
            default:
                return true;
        }
    });

    if (filteredDownloads.length === 0) {
        downloadsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📥</div>
                <p>No downloads in this category</p>
                <p class="empty-hint">Switch tabs to see other downloads</p>
            </div>
        `;
        return;
    }

    // Sort: active first, then by creation time
    filteredDownloads.sort((a, b) => {
        const statusOrder = { downloading: 0, pending: 1, completed: 2, failed: 3 };
        const orderDiff = statusOrder[a.status] - statusOrder[b.status];
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    downloadsContainer.innerHTML = filteredDownloads
        .map(download => createDownloadItemHTML(download))
        .join('');

    // Attach event listeners
    filteredDownloads.forEach(download => {
        const removeBtn = document.querySelector(`[data-download-id="${download.id}"]`);
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeDownload(download.id));
        }
    });
}

function updateDownloadItem(downloadId, data) {
    const existingItem = document.getElementById(`download-${downloadId}`);
    if (!existingItem) {
        // Item not in current view, re-render
        renderDownloads();
        return;
    }

    // Update progress bar
    const progressBar = existingItem.querySelector('.progress-bar');
    const progressText = existingItem.querySelector('.progress-text');
    if (progressBar && progressText) {
        progressBar.style.width = `${data.progress}%`;
        progressText.textContent = `${data.progress.toFixed(1)}%`;
    }

    // Update stats
    const speedStat = existingItem.querySelector('.speed-value');
    const etaStat = existingItem.querySelector('.eta-value');
    const downloadedStat = existingItem.querySelector('.downloaded-value');

    if (speedStat) speedStat.textContent = data.speed || 'N/A';
    if (etaStat) etaStat.textContent = data.eta || 'N/A';
    if (downloadedStat) downloadedStat.textContent = data.downloaded || '0 MB';

    // Update status badge
    const statusBadge = existingItem.querySelector('.download-status');
    if (statusBadge) {
        statusBadge.className = `download-status ${data.status}`;
        statusBadge.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    }

    // Update container class
    existingItem.className = `download-item ${data.status}`;

    // Add error message if failed
    if (data.status === 'failed' && data.error) {
        const errorContainer = existingItem.querySelector('.error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <strong>Error:</strong> ${data.error}
                </div>
            `;
        }
    }
}

function createDownloadItemHTML(download) {
    const statusClass = download.status;
    const statusText = download.status.charAt(0).toUpperCase() + download.status.slice(1);

    let progressHTML = '';
    if (download.status === 'downloading' || download.status === 'pending') {
        progressHTML = `
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${download.progress}%"></div>
                <div class="progress-text">${download.progress.toFixed(1)}%</div>
            </div>
            <div class="download-stats">
                <div class="download-stat">
                    <span class="download-stat-label">Speed</span>
                    <span class="speed-value">${download.speed}</span>
                </div>
                <div class="download-stat">
                    <span class="download-stat-label">ETA</span>
                    <span class="eta-value">${download.eta}</span>
                </div>
                <div class="download-stat">
                    <span class="download-stat-label">Downloaded</span>
                    <span class="downloaded-value">${download.downloaded}</span>
                </div>
                <div class="download-stat">
                    <span class="download-stat-label">Total</span>
                    <span>${download.total}</span>
                </div>
            </div>
        `;
    } else if (download.status === 'completed') {
        progressHTML = `
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: 100%"></div>
                <div class="progress-text">100%</div>
            </div>
            <div class="download-stats">
                <div class="download-stat">
                    <span class="download-stat-label">Filename</span>
                    <span>${download.filename || 'N/A'}</span>
                </div>
                <div class="download-stat">
                    <span class="download-stat-label">Completed At</span>
                    <span>${new Date(download.completed_at).toLocaleString()}</span>
                </div>
            </div>
        `;
    }

    let errorHTML = '';
    if (download.status === 'failed' && download.error) {
        errorHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${download.error}
            </div>
        `;
    }

    return `
        <div id="download-${download.id}" class="download-item ${statusClass}">
            <div class="download-header">
                <div class="download-info">
                    <div class="download-url">${download.url}</div>
                    <div class="download-title">
                        ${download.title || 'Loading...'}
                        <span class="download-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <button class="btn-danger" data-download-id="${download.id}">🗑️ Remove</button>
            </div>
            ${progressHTML}
            <div class="error-container">${errorHTML}</div>
        </div>
    `;
}

function updateStats() {
    const downloads = Object.values(state.downloads);

    const active = downloads.filter(d => d.status === 'pending' || d.status === 'downloading').length;
    const completed = downloads.filter(d => d.status === 'completed').length;
    const failed = downloads.filter(d => d.status === 'failed').length;

    activeCount.textContent = active;
    completedCount.textContent = completed;
    failedCount.textContent = failed;
}

function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notification-container');

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('removing');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}
