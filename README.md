# Video Downloader

A modern web-based video downloader with real-time progress tracking, built with Python Flask and yt-dlp.

## Features

- **Real-time Progress Tracking**: See download progress, speed, and ETA updated in real-time
- **Download Queue Management**: Track multiple downloads simultaneously
- **Quality Selection**: Choose video quality (best, worst, audio-only, etc.)
- **Status Categories**: View downloads by status (Active, Completed, Failed, All)
- **Completion Notifications**: Get notified when downloads complete or fail
- **Error Handling**: Clear error messages for failed downloads
- **Modern UI**: Clean, responsive interface with progress bars and stats
- **WebSocket Updates**: Real-time updates without page refresh

## Screenshots

The application features:
- A clean download form with URL input and quality selector
- Real-time progress bars showing download percentage
- Download statistics (speed, ETA, downloaded/total size)
- Tabbed interface to filter downloads by status
- Queue statistics showing active, completed, and failed downloads

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Images
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the application:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. To download a video:
   - Paste a video URL (YouTube, Vimeo, etc.)
   - Select desired quality
   - Click "Download"
   - Watch real-time progress in the queue

## Download Location

By default, videos are saved to:
```
~/Downloads/yt-downloads
```

This directory is created automatically if it doesn't exist.

## Supported Sites

This application uses yt-dlp, which supports 1000+ sites including:
- YouTube
- Vimeo
- Dailymotion
- Facebook
- Instagram
- TikTok
- Twitter
- And many more

For a full list, visit: https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md

## API Endpoints

### Start Download
```http
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=...",
  "format": "best",
  "output_path": "/path/to/downloads"
}
```

### Get All Downloads
```http
GET /api/downloads
```

### Get Specific Download
```http
GET /api/download/<download_id>
```

### Remove Download
```http
DELETE /api/download/<download_id>
```

### Get Download Path
```http
GET /api/settings/download-path
```

## WebSocket Events

The application uses WebSocket for real-time updates:

- `connect`: Client connected to server
- `disconnect`: Client disconnected from server
- `queue_update`: Full queue state sent to client
- `download_progress`: Progress update for a download
- `download_complete`: Download completed successfully
- `download_failed`: Download failed with error
- `download_removed`: Download removed from queue

## Technology Stack

- **Backend**: Flask (Python web framework)
- **Download Engine**: yt-dlp (video downloader)
- **Real-time Communication**: Flask-SocketIO (WebSocket support)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **WebSocket Client**: Socket.IO

## Project Structure

```
Images/
├── app.py                 # Flask application and download logic
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Application styles
│   └── js/
│       └── app.js        # Frontend JavaScript
├── downloads/            # Default download directory (created at runtime)
└── README.md            # This file
```

## Configuration

You can customize the application by modifying `app.py`:

- **Download Directory**: Change `DOWNLOADS_DIR` variable
- **Server Port**: Change `port` parameter in `socketio.run()`
- **Host**: Change `host` parameter (default: '0.0.0.0')
- **yt-dlp Options**: Modify `ydl_opts` in `download_video()` function

## Troubleshooting

### Downloads Failing

1. Ensure yt-dlp is up to date:
```bash
pip install --upgrade yt-dlp
```

2. Check if the site is supported:
```bash
yt-dlp --list-extractors
```

### Port Already in Use

Change the port in `app.py`:
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5001)
```

### Permission Errors

Ensure the download directory has write permissions:
```bash
chmod 755 ~/Downloads/yt-downloads
```

## Development

To run in development mode with auto-reload:
```bash
python app.py
```

The server runs with `debug=True` by default, which enables:
- Auto-reload on code changes
- Detailed error messages
- Development tools

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Savoyeimages (fredericksavoye@gmail.com)