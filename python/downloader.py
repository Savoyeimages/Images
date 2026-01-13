import yt_dlp
import json
import sys
from typing import Dict, Any, Optional


class VideoDownloader:
    """Wrapper for yt-dlp to download videos"""

    def __init__(self):
        self.current_download = None

    def progress_hook(self, d: Dict[str, Any]):
        """Hook for download progress updates"""
        if d['status'] == 'downloading':
            try:
                percent = d.get('_percent_str', '0%').strip().replace('%', '')
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                speed = d.get('speed', 0) or 0
                eta = d.get('eta', 0) or 0

                progress = {
                    'type': 'progress',
                    'data': {
                        'percent': float(percent),
                        'downloaded': downloaded,
                        'total': total,
                        'speed': speed,
                        'eta': eta
                    }
                }
                print(json.dumps(progress), flush=True)
            except Exception as e:
                sys.stderr.write(f"Progress hook error: {str(e)}\n")
                sys.stderr.flush()

    def analyze_video(self, url: str) -> Dict[str, Any]:
        """Extract video information without downloading"""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                if info is None:
                    raise Exception("Could not extract video information")

                # Process formats
                formats = []
                if 'formats' in info:
                    seen_qualities = set()
                    for fmt in info['formats']:
                        # Skip audio-only or video-only formats without merging
                        if fmt.get('acodec') == 'none' and fmt.get('vcodec') == 'none':
                            continue

                        # Create a quality label
                        height = fmt.get('height')
                        quality_label = f"{height}p" if height else "audio"

                        if quality_label in seen_qualities:
                            continue
                        seen_qualities.add(quality_label)

                        format_info = {
                            'format_id': fmt.get('format_id', ''),
                            'ext': fmt.get('ext', 'mp4'),
                            'quality': quality_label,
                            'filesize': fmt.get('filesize'),
                            'resolution': fmt.get('resolution', 'unknown'),
                            'height': height
                        }
                        formats.append(format_info)

                # Sort by quality (height)
                formats.sort(key=lambda x: x.get('height', 0) or 0, reverse=True)

                # Add best quality option
                if formats:
                    formats.insert(0, {
                        'format_id': 'best',
                        'ext': 'mp4',
                        'quality': 'Best Available',
                        'filesize': None,
                        'resolution': 'highest',
                        'height': 99999
                    })

                return {
                    'title': info.get('title', 'Unknown'),
                    'thumbnail': info.get('thumbnail', ''),
                    'duration': info.get('duration', 0),
                    'uploader': info.get('uploader', 'Unknown'),
                    'view_count': info.get('view_count', 0),
                    'formats': formats[:10]  # Limit to top 10 formats
                }

        except Exception as e:
            raise Exception(f"Failed to analyze video: {str(e)}")

    def download_video(
        self,
        url: str,
        quality: str,
        output_path: str
    ) -> Dict[str, Any]:
        """Download video with specified quality"""

        ydl_opts = {
            'format': quality if quality != 'best' else 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': f'{output_path}/%(title)s.%(ext)s',
            'progress_hooks': [self.progress_hook],
            'merge_output_format': 'mp4',
            'quiet': True,
            'no_warnings': True
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)

                if info is None:
                    raise Exception("Download failed - no info returned")

                filename = ydl.prepare_filename(info)

                return {
                    'filename': filename,
                    'title': info.get('title', 'Unknown'),
                    'path': output_path
                }

        except Exception as e:
            raise Exception(f"Failed to download video: {str(e)}")
