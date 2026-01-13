import os
import time
import threading
import uuid
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Default download directory
DOWNLOADS_DIR = Path.home() / 'Downloads' / 'yt-downloads'
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# In-memory download queue
download_queue = {}

class DownloadStatus:
    PENDING = 'pending'
    DOWNLOADING = 'downloading'
    COMPLETED = 'completed'
    FAILED = 'failed'

def progress_hook(d, download_id):
    """Callback for yt-dlp to report progress"""
    if d['status'] == 'downloading':
        # Parse progress information
        total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
        downloaded_bytes = d.get('downloaded_bytes', 0)
        speed = d.get('speed', 0)
        eta = d.get('eta', 0)

        # Calculate percentage
        percentage = 0
        if total_bytes > 0:
            percentage = (downloaded_bytes / total_bytes) * 100

        # Format speed
        speed_str = f"{speed / 1024 / 1024:.2f} MB/s" if speed else "N/A"

        # Format ETA
        eta_str = f"{eta}s" if eta else "N/A"

        # Update download queue
        download_queue[download_id].update({
            'status': DownloadStatus.DOWNLOADING,
            'progress': round(percentage, 2),
            'speed': speed_str,
            'eta': eta_str,
            'downloaded': f"{downloaded_bytes / 1024 / 1024:.2f} MB",
            'total': f"{total_bytes / 1024 / 1024:.2f} MB" if total_bytes else "Unknown"
        })

        # Emit progress to client
        socketio.emit('download_progress', {
            'download_id': download_id,
            'data': download_queue[download_id]
        })

    elif d['status'] == 'finished':
        download_queue[download_id].update({
            'status': DownloadStatus.COMPLETED,
            'progress': 100,
            'completed_at': datetime.now().isoformat(),
            'filename': d.get('filename', 'Unknown')
        })

        socketio.emit('download_complete', {
            'download_id': download_id,
            'data': download_queue[download_id]
        })

def download_video(url, download_id, output_path, format_choice='best'):
    """Download video using yt-dlp"""
    try:
        ydl_opts = {
            'format': format_choice,
            'outtmpl': str(output_path / '%(title)s.%(ext)s'),
            'progress_hooks': [lambda d: progress_hook(d, download_id)],
            'noplaylist': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)

            download_queue[download_id].update({
                'status': DownloadStatus.COMPLETED,
                'progress': 100,
                'completed_at': datetime.now().isoformat(),
                'filename': os.path.basename(filename),
                'title': info.get('title', 'Unknown')
            })

    except Exception as e:
        download_queue[download_id].update({
            'status': DownloadStatus.FAILED,
            'error': str(e),
            'failed_at': datetime.now().isoformat()
        })

        socketio.emit('download_failed', {
            'download_id': download_id,
            'data': download_queue[download_id]
        })

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/api/download', methods=['POST'])
def start_download():
    """Start a new download"""
    data = request.json
    url = data.get('url')
    output_path = data.get('output_path', str(DOWNLOADS_DIR))
    format_choice = data.get('format', 'best')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    # Generate unique download ID
    download_id = str(uuid.uuid4())

    # Create download entry
    download_queue[download_id] = {
        'id': download_id,
        'url': url,
        'status': DownloadStatus.PENDING,
        'progress': 0,
        'speed': 'N/A',
        'eta': 'N/A',
        'downloaded': '0 MB',
        'total': 'Unknown',
        'created_at': datetime.now().isoformat(),
        'output_path': output_path,
        'format': format_choice
    }

    # Start download in a separate thread
    thread = threading.Thread(
        target=download_video,
        args=(url, download_id, Path(output_path), format_choice)
    )
    thread.daemon = True
    thread.start()

    return jsonify({
        'download_id': download_id,
        'message': 'Download started',
        'data': download_queue[download_id]
    })

@app.route('/api/downloads', methods=['GET'])
def get_downloads():
    """Get all downloads"""
    return jsonify({
        'downloads': list(download_queue.values())
    })

@app.route('/api/download/<download_id>', methods=['GET'])
def get_download(download_id):
    """Get specific download status"""
    if download_id not in download_queue:
        return jsonify({'error': 'Download not found'}), 404

    return jsonify({
        'download': download_queue[download_id]
    })

@app.route('/api/download/<download_id>', methods=['DELETE'])
def remove_download(download_id):
    """Remove download from queue"""
    if download_id not in download_queue:
        return jsonify({'error': 'Download not found'}), 404

    del download_queue[download_id]

    socketio.emit('download_removed', {
        'download_id': download_id
    })

    return jsonify({
        'message': 'Download removed'
    })

@app.route('/api/settings/download-path', methods=['GET'])
def get_download_path():
    """Get current download path"""
    return jsonify({
        'path': str(DOWNLOADS_DIR)
    })

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    emit('connected', {'data': 'Connected to server'})
    # Send current queue state
    emit('queue_update', {'downloads': list(download_queue.values())})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    pass

if __name__ == '__main__':
    print(f"Starting server...")
    print(f"Downloads will be saved to: {DOWNLOADS_DIR}")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
