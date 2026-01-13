# Video Downloader

A desktop application built with Electron and Python that extracts video information from various platforms using yt-dlp.

## Features

- **Video Information Extraction**: Get detailed information about videos from YouTube, Vimeo, and many other platforms
- **Format Detection**: View all available video formats with quality options
- **Quality Filtering**: Filter formats by type (Video+Audio, Video Only, Audio Only)
- **Thumbnail Preview**: Display video thumbnails
- **Metadata Display**: Show video title, uploader, and duration
- **User-Friendly UI**: Modern, responsive interface with real-time feedback
- **Error Handling**: Comprehensive error handling for invalid URLs and failed requests

## Phase 2 Implementation

This is Phase 2 of the project, which includes:
- Python backend integration with yt-dlp
- IPC communication between Electron frontend and Python backend
- Video information extraction (title, formats, thumbnail, metadata)
- UI display of video information with quality options
- Error handling for invalid URLs

## Prerequisites

- Node.js (v14 or higher)
- Python 3.7 or higher
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Images
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

   Or using pip3:
   ```bash
   pip3 install -r requirements.txt
   ```

## Usage

1. **Start the application**
   ```bash
   npm start
   ```

2. **Using the application**
   - Enter a video URL in the input field (YouTube, Vimeo, etc.)
   - Click "Extract Info" or press Enter
   - View the video information including:
     - Video thumbnail
     - Title and uploader
     - Duration
     - Available formats and quality options
   - Use the filter buttons to view specific format types

## Development

Run in development mode with DevTools open:
```bash
npm run dev
```

## Project Structure

```
Images/
├── main.js              # Electron main process
├── preload.js           # Preload script for secure IPC
├── backend.py           # Python backend with yt-dlp
├── index.html           # Frontend HTML
├── styles.css           # Frontend styles
├── renderer.js          # Frontend JavaScript
├── package.json         # Node.js dependencies
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## How It Works

1. **Frontend (Electron Renderer)**:
   - User enters a URL in the input field
   - Sends extraction request to main process via IPC

2. **Main Process (Electron)**:
   - Receives IPC request from renderer
   - Forwards request to Python backend via stdin/stdout
   - Returns response to renderer

3. **Backend (Python + yt-dlp)**:
   - Receives JSON messages via stdin
   - Extracts video information using yt-dlp
   - Returns formatted data via stdout

4. **Data Flow**:
   ```
   Frontend → IPC → Main Process → Python Backend → yt-dlp
                                                      ↓
   Frontend ← IPC ← Main Process ← Python Backend ← Data
   ```

## Error Handling

The application includes comprehensive error handling for:
- Invalid URLs
- Network failures
- Unsupported platforms
- Backend communication errors
- Python process failures

## Supported Platforms

Supports video extraction from 1000+ websites including:
- YouTube
- Vimeo
- Dailymotion
- Twitter/X
- Facebook
- Instagram
- TikTok
- And many more...

## Technologies Used

- **Electron**: Desktop application framework
- **Python**: Backend processing
- **yt-dlp**: Video extraction library
- **IPC (Inter-Process Communication)**: Communication between Electron and Python
- **HTML/CSS/JavaScript**: Frontend UI

## Future Enhancements (Phase 3+)

- Video downloading functionality
- Download progress tracking
- Multiple simultaneous downloads
- Download history
- Custom output directory selection
- Format conversion options

## License

MIT

## Troubleshooting

### Backend connection failed
- Ensure Python 3 is installed and accessible via `python3` command
- Check that yt-dlp is installed: `pip3 show yt-dlp`

### "No formats available"
- The video platform may be blocking or rate-limiting requests
- Try a different video URL
- Update yt-dlp: `pip3 install --upgrade yt-dlp`

### Application won't start
- Delete `node_modules` and run `npm install` again
- Check console for error messages
- Ensure all dependencies are installed