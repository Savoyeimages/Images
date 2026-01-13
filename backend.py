#!/usr/bin/env python3
"""
Video extraction backend using yt-dlp
Communicates with Electron frontend via stdin/stdout JSON messages
"""

import sys
import json
import yt_dlp
from typing import Dict, Any, List


def extract_video_info(url: str) -> Dict[str, Any]:
    """
    Extract video information using yt-dlp

    Args:
        url: Video URL to extract information from

    Returns:
        Dictionary containing video information
    """
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            # Extract available formats with quality information
            formats = []
            seen_combinations = set()

            if 'formats' in info:
                for fmt in info['formats']:
                    # Get format details
                    format_id = fmt.get('format_id', '')
                    ext = fmt.get('ext', 'unknown')
                    resolution = fmt.get('resolution', 'audio only')

                    # Get quality info
                    height = fmt.get('height')
                    width = fmt.get('width')
                    fps = fmt.get('fps')
                    vcodec = fmt.get('vcodec', 'none')
                    acodec = fmt.get('acodec', 'none')
                    filesize = fmt.get('filesize') or fmt.get('filesize_approx')

                    # Create a quality label
                    if height:
                        quality = f"{height}p"
                        if fps and fps > 30:
                            quality += f"{fps}"
                    elif acodec != 'none' and vcodec == 'none':
                        quality = "audio only"
                    else:
                        quality = resolution

                    # Format type (video+audio, video only, audio only)
                    if vcodec != 'none' and acodec != 'none':
                        format_type = "video+audio"
                    elif vcodec != 'none':
                        format_type = "video only"
                    else:
                        format_type = "audio only"

                    # Create unique identifier to avoid duplicates
                    combo_key = (quality, ext, format_type)
                    if combo_key in seen_combinations:
                        continue
                    seen_combinations.add(combo_key)

                    formats.append({
                        'format_id': format_id,
                        'quality': quality,
                        'ext': ext,
                        'resolution': resolution,
                        'width': width,
                        'height': height,
                        'fps': fps,
                        'filesize': filesize,
                        'vcodec': vcodec,
                        'acodec': acodec,
                        'format_type': format_type,
                        'format_note': fmt.get('format_note', '')
                    })

            # Sort formats by quality (height)
            formats.sort(key=lambda x: (
                x['height'] if x['height'] else 0,
                x['fps'] if x['fps'] else 0
            ), reverse=True)

            # Prepare response
            result = {
                'success': True,
                'data': {
                    'title': info.get('title', 'Unknown Title'),
                    'thumbnail': info.get('thumbnail', ''),
                    'duration': info.get('duration', 0),
                    'uploader': info.get('uploader', 'Unknown'),
                    'description': info.get('description', ''),
                    'formats': formats,
                    'webpage_url': info.get('webpage_url', url),
                    'extractor': info.get('extractor', ''),
                }
            }

            return result

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }


def handle_message(message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle incoming message from Electron frontend

    Args:
        message: JSON message with 'action' and optional parameters

    Returns:
        Response dictionary
    """
    action = message.get('action')

    if action == 'extract_info':
        url = message.get('url', '')
        if not url:
            return {
                'success': False,
                'error': 'No URL provided',
                'error_type': 'ValidationError'
            }
        return extract_video_info(url)

    elif action == 'ping':
        return {'success': True, 'message': 'pong'}

    else:
        return {
            'success': False,
            'error': f'Unknown action: {action}',
            'error_type': 'UnknownAction'
        }


def main():
    """
    Main loop - read JSON messages from stdin, process, write to stdout
    """
    # Ensure unbuffered output
    sys.stdout.reconfigure(line_buffering=True)

    while True:
        try:
            # Read line from stdin
            line = sys.stdin.readline()
            if not line:
                break

            # Parse JSON message
            message = json.loads(line.strip())

            # Process message
            response = handle_message(message)

            # Send response
            print(json.dumps(response), flush=True)

        except json.JSONDecodeError as e:
            error_response = {
                'success': False,
                'error': f'Invalid JSON: {str(e)}',
                'error_type': 'JSONDecodeError'
            }
            print(json.dumps(error_response), flush=True)

        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
            print(json.dumps(error_response), flush=True)


if __name__ == '__main__':
    main()
