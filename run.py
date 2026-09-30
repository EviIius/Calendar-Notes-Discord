#!/usr/bin/env python3
"""
Calendar-Notes-Discord - Local Runner
Serves the mobile-friendly web app on port 8000.
Falls back to Python's built-in HTTP server if FastAPI/Uvicorn aren't installed yet.
"""

import sys
import os
import socket

PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")

def get_tailscale_ip():
    """Detect Tailscale IP if available for quick mobile access."""
    import subprocess
    try:
        res = subprocess.run(["tailscale", "ip", "-4"], capture_output=True, text=True, timeout=2)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception:
        pass
    return None

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(base_dir, "app", "static")

    if not os.path.exists(static_dir):
        print(f"Error: Static directory not found at {static_dir}")
        sys.exit(1)

    tailscale_ip = get_tailscale_ip()

    print("=" * 60)
    print("  🚀 Calendar-Notes-Discord is starting up!")
    print("=" * 60)
    print(f"  Local access:       http://localhost:{PORT}")
    print(f"  LAN access:         http://{socket.gethostbyname(socket.gethostname())}:{PORT}")
    if tailscale_ip:
        print(f"  Tailscale (Mobile): http://{tailscale_ip}:{PORT}")
    else:
        print(f"  Mobile via LAN:     http://<your-machine-ip>:{PORT}")
    print("=" * 60)

    # Check if FastAPI / Uvicorn are available
    try:
        import uvicorn
        from app.server import app
        print("Running with FastAPI & Uvicorn engine...\n")
        uvicorn.run(app, host=HOST, port=PORT, log_level="info")
    except ImportError:
        import http.server
        import socketserver

        class Handler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=static_dir, **kwargs)

        print("FastAPI not installed yet. Running with built-in Python HTTP server...")
        print("To enable full backend API later: pip install -r requirements.txt\n")

        with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nShutting down server gracefully.")

if __name__ == "__main__":
    main()
