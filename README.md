# 📹 Video Downloader

A modern, cross-platform desktop application for downloading videos from YouTube, Vimeo, and other supported platforms. Built with Electron, React, TypeScript, and powered by yt-dlp.

## ✨ Features

- 🎬 **Multi-Platform Support**: Download videos from YouTube, Vimeo, and 1000+ other sites
- 🎯 **Quality Selection**: Choose from available video qualities and formats
- 📊 **Real-time Progress**: Live download progress with speed and ETA
- 🎨 **Modern UI**: Clean, intuitive interface with dark theme
- 💻 **Cross-Platform**: Works on Windows, macOS, and Linux
- ⚡ **Fast Downloads**: Powered by yt-dlp and ffmpeg

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron 33
- **Backend**: Python 3 + yt-dlp
- **Video Processing**: ffmpeg
- **Styling**: Modern CSS with gradients and animations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python 3** (v3.8 or higher)
- **ffmpeg** (for video processing)

### Installing ffmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH, or use:
```bash
choco install ffmpeg
```

## 🚀 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd video-downloader
```

2. **Install Node.js dependencies:**
```bash
npm install
```

3. **Install Python dependencies:**
```bash
pip install -r python/requirements.txt
# or
pip3 install -r python/requirements.txt
```

## 🏃 Running in Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

This will:
1. Start Vite dev server on `http://localhost:5173`
2. Launch Electron app with hot-reload enabled
3. Open DevTools automatically

## 📦 Building for Production

Build the application for your platform:

```bash
npm run build
```

This will create distributable packages in the `release/` directory.

### Platform-Specific Builds

The build configuration supports:
- **macOS**: `.dmg` installer
- **Windows**: NSIS installer (`.exe`)
- **Linux**: AppImage and `.deb` package

## 🎮 Usage

1. **Launch the app** (either in dev mode or built version)

2. **Enter a video URL** from supported platforms (YouTube, Vimeo, etc.)

3. **Click "Analyze"** to fetch video information and available formats

4. **Select quality** from the dropdown menu

5. **Choose download location** by clicking "Browse"

6. **Click "Download"** to start downloading

7. **Monitor progress** with real-time updates showing:
   - Download percentage
   - Downloaded size / Total size
   - Download speed
   - Estimated time remaining

## 📁 Project Structure

```
video-downloader/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry point
│   ├── preload.ts        # Preload script for IPC
│   └── python-bridge.ts  # Python backend communication
├── src/                  # React frontend
│   ├── components/       # UI components
│   │   ├── UrlInput.tsx
│   │   ├── VideoInfo.tsx
│   │   ├── QualitySelector.tsx
│   │   └── ProgressBar.tsx
│   ├── styles/
│   │   └── App.css       # Application styles
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   ├── App.tsx           # Main React component
│   └── main.tsx          # React entry point
├── python/               # Python backend
│   ├── main.py           # Python process entry point
│   ├── downloader.py     # yt-dlp wrapper
│   └── requirements.txt  # Python dependencies
├── public/               # Static assets
├── package.json          # Node.js dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── README.md
```

## 🔧 Configuration

### Supported Platforms

The app supports downloading from 1000+ websites through yt-dlp, including:
- YouTube
- Vimeo
- Dailymotion
- Facebook
- Instagram
- Twitter
- And many more...

For a full list, run:
```bash
yt-dlp --list-extractors
```

## 🐛 Troubleshooting

### Python not found
Make sure Python 3 is installed and accessible via `python3` command:
```bash
python3 --version
```

### yt-dlp errors
Update yt-dlp to the latest version:
```bash
pip install --upgrade yt-dlp
```

### ffmpeg not found
Verify ffmpeg is installed and in your PATH:
```bash
ffmpeg -version
```

### Download fails
- Check your internet connection
- Verify the video URL is valid and accessible
- Some videos may be region-locked or private
- Try updating yt-dlp to the latest version

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This tool is for personal use only. Please respect content creators' rights and terms of service of the platforms you're downloading from. Do not use this tool to download copyrighted content without permission.

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The powerful video downloader
- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [ffmpeg](https://ffmpeg.org/) - Video processing

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ using Electron, React, and yt-dlp
