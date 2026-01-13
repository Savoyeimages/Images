// UI Elements
const urlInput = document.getElementById('url-input');
const extractBtn = document.getElementById('extract-btn');
const errorMessage = document.getElementById('error-message');
const loading = document.getElementById('loading');
const videoInfoSection = document.getElementById('video-info-section');
const statusMessage = document.getElementById('status-message');

// Video Info Elements
const videoThumbnail = document.getElementById('video-thumbnail');
const videoTitle = document.getElementById('video-title');
const videoUploader = document.getElementById('video-uploader');
const videoDuration = document.getElementById('video-duration');
const formatsList = document.getElementById('formats-list');

// Current video data
let currentVideoData = null;
let currentFilter = 'all';

// Format seconds to readable time
function formatDuration(seconds) {
  if (!seconds) return 'Unknown duration';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Format filesize to readable format
function formatFilesize(bytes) {
  if (!bytes) return 'Unknown size';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  statusMessage.textContent = 'Error';
  statusMessage.style.color = '#c33';

  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

// Hide error message
function hideError() {
  errorMessage.style.display = 'none';
}

// Show loading state
function showLoading() {
  loading.style.display = 'block';
  videoInfoSection.style.display = 'none';
  extractBtn.disabled = true;
  hideError();
  statusMessage.textContent = 'Loading...';
  statusMessage.style.color = '#666';
}

// Hide loading state
function hideLoading() {
  loading.style.display = 'none';
  extractBtn.disabled = false;
}

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Render formats list
function renderFormats(formats, filter = 'all') {
  formatsList.innerHTML = '';

  // Filter formats
  let filteredFormats = formats;
  if (filter !== 'all') {
    filteredFormats = formats.filter(fmt => fmt.format_type === filter);
  }

  if (filteredFormats.length === 0) {
    formatsList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No formats available for this filter.</p>';
    return;
  }

  filteredFormats.forEach(format => {
    const formatItem = document.createElement('div');
    formatItem.className = 'format-item';

    // Determine format type class
    let typeClass = 'video-audio';
    if (format.format_type === 'video only') {
      typeClass = 'video-only';
    } else if (format.format_type === 'audio only') {
      typeClass = 'audio-only';
    }

    // Build format details
    const details = [];
    if (format.ext) details.push(format.ext.toUpperCase());
    if (format.fps) details.push(`${format.fps}fps`);
    if (format.vcodec && format.vcodec !== 'none') details.push(format.vcodec);
    if (format.acodec && format.acodec !== 'none') details.push(format.acodec);

    formatItem.innerHTML = `
      <div class="format-info">
        <div class="format-quality">
          ${format.quality}
          <span class="format-type ${typeClass}">${format.format_type}</span>
        </div>
        <div class="format-details">
          ${details.join(' • ')}
        </div>
        ${format.filesize ? `<div class="format-filesize">${formatFilesize(format.filesize)}</div>` : ''}
      </div>
    `;

    formatsList.appendChild(formatItem);
  });
}

// Display video information
function displayVideoInfo(data) {
  currentVideoData = data;

  // Set thumbnail
  if (data.thumbnail) {
    videoThumbnail.src = data.thumbnail;
    videoThumbnail.alt = data.title;
  }

  // Set title
  videoTitle.textContent = data.title;

  // Set uploader
  videoUploader.textContent = data.uploader || 'Unknown uploader';

  // Set duration
  videoDuration.textContent = formatDuration(data.duration);

  // Render formats
  renderFormats(data.formats, currentFilter);

  // Show video info section
  videoInfoSection.style.display = 'block';
  statusMessage.textContent = 'Video info extracted successfully';
  statusMessage.style.color = '#4caf50';
}

// Extract video info
async function extractVideoInfo() {
  const url = urlInput.value.trim();

  // Validate URL
  if (!url) {
    showError('Please enter a URL');
    return;
  }

  if (!isValidUrl(url)) {
    showError('Please enter a valid URL');
    return;
  }

  showLoading();

  try {
    const response = await window.api.extractVideoInfo(url);

    hideLoading();

    if (response.success) {
      displayVideoInfo(response.data);
    } else {
      const errorMsg = response.error || 'Failed to extract video information';
      showError(errorMsg);
    }
  } catch (error) {
    hideLoading();
    showError('An unexpected error occurred: ' + error.message);
  }
}

// Event Listeners

// Extract button click
extractBtn.addEventListener('click', extractVideoInfo);

// Enter key in URL input
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    extractVideoInfo();
  }
});

// Filter buttons
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update filter and re-render
    currentFilter = btn.dataset.filter;

    if (currentVideoData) {
      renderFormats(currentVideoData.formats, currentFilter);
    }
  });
});

// Test backend connection on load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await window.api.pingBackend();
    if (response.success) {
      statusMessage.textContent = 'Backend connected - Ready';
      statusMessage.style.color = '#4caf50';
    } else {
      statusMessage.textContent = 'Backend connection failed';
      statusMessage.style.color = '#c33';
    }
  } catch (error) {
    statusMessage.textContent = 'Backend not available';
    statusMessage.style.color = '#c33';
  }
});
