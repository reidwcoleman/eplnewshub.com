#!/usr/bin/env python3
"""
Simple Development Server for EPL News Hub
Run with: python3 dev-server.py
"""

import http.server
import socketserver
import webbrowser
import sys
import os

PORT = 8080
HOST = '0.0.0.0'

class DevHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom log format
        sys.stdout.write(f"[DEV] {self.address_string()} - {format % args}\n")

def main():
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("""
╔════════════════════════════════════════════════╗
║                                                ║
║     EPL News Hub Development Server            ║
║                                                ║
║     🚀 Server starting at:                     ║
║     http://localhost:{}                      ║
║                                                ║
║     📝 Development Features:                   ║
║     - Test mode automatically enabled          ║
║     - Stripe test keys active                  ║
║     - Development banner visible               ║
║                                                ║
║     🔧 Keyboard Shortcuts (in browser):        ║
║     - Ctrl+Shift+D: Toggle dev mode           ║
║     - Ctrl+Shift+T: Show test cards           ║
║                                                ║
║     💳 Test Card: 4242 4242 4242 4242         ║
║                                                ║
║     Press Ctrl+C to stop the server           ║
║                                                ║
╚════════════════════════════════════════════════╝
    """.format(PORT))
    
    with socketserver.TCPServer((HOST, PORT), DevHTTPRequestHandler) as httpd:
        # Open browser automatically
        url = f"http://localhost:{PORT}/membership.html?dev=true"
        print(f"Opening browser at: {url}")
        webbrowser.open(url)
        
        print(f"\nServer running at http://localhost:{PORT}/")
        print("Press Ctrl+C to stop\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()