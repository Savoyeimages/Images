#!/usr/bin/env python3
"""
Python backend for video downloader
Communicates with Electron via stdin/stdout using JSON messages
"""

import sys
import json
from downloader import VideoDownloader


def send_response(action: str, success: bool, data=None, error=None):
    """Send JSON response to Electron"""
    response = {
        'type': 'result',
        'action': action,
        'success': success
    }
    if data is not None:
        response['data'] = data
    if error is not None:
        response['error'] = error

    print(json.dumps(response), flush=True)


def main():
    """Main loop - read commands from stdin and execute them"""
    downloader = VideoDownloader()

    sys.stderr.write("Python backend started\n")
    sys.stderr.flush()

    try:
        for line in sys.stdin:
            try:
                command = json.loads(line.strip())
                action = command.get('action')

                if action == 'analyze':
                    url = command.get('url')
                    if not url:
                        send_response('analyze', False, error='URL is required')
                        continue

                    try:
                        result = downloader.analyze_video(url)
                        send_response('analyze', True, data=result)
                    except Exception as e:
                        send_response('analyze', False, error=str(e))

                elif action == 'download':
                    url = command.get('url')
                    quality = command.get('quality', 'best')
                    output_path = command.get('output_path', '.')

                    if not url:
                        send_response('download', False, error='URL is required')
                        continue

                    try:
                        result = downloader.download_video(url, quality, output_path)
                        send_response('download', True, data=result)
                    except Exception as e:
                        send_response('download', False, error=str(e))

                else:
                    send_response(action or 'unknown', False, error='Unknown action')

            except json.JSONDecodeError as e:
                sys.stderr.write(f"JSON decode error: {str(e)}\n")
                sys.stderr.flush()
            except Exception as e:
                sys.stderr.write(f"Error processing command: {str(e)}\n")
                sys.stderr.flush()

    except KeyboardInterrupt:
        sys.stderr.write("Python backend shutting down\n")
        sys.stderr.flush()


if __name__ == '__main__':
    main()
