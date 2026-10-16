#!/usr/bin/env python3
"""
Serveur Local UI/UX pour Senior SysAdmin & DevSecOps (Python 3 - Standard Library)
Zéro dépendance externe. Compatible Linux, macOS et Windows.
Auteur : Boris Owandja (@Boris13-tech)
"""
import sys
import os
import json
import subprocess
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8765
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
SKILLS_DIR = os.path.join(ROOT_DIR, "skills")

class SysAdminApiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DOCS_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/status":
            import socket
            self.send_json({
                "status": "ok",
                "mode": "local-live-python",
                "host": socket.gethostname(),
                "os": sys.platform
            })
            return

        if path == "/api/audit/health":
            if sys.platform.startswith("win"):
                ps_script = os.path.join(SKILLS_DIR, "windows-sysadmin-senior", "scripts", "win-health-audit.ps1")
                proc = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_script],
                                      capture_output=True, text=True)
                try:
                    self.send_json(json.loads(proc.stdout))
                except Exception:
                    self.send_json({"raw_output": proc.stdout, "error": proc.stderr})
            else:
                sh_script = os.path.join(SKILLS_DIR, "linux-sysadmin-senior", "scripts", "linux-health-audit.sh")
                proc = subprocess.run(["bash", sh_script], capture_output=True, text=True)
                self.send_json({"raw_output": proc.stdout, "status": "ok"})
            return

        if path == "/api/audit/security":
            if sys.platform.startswith("win"):
                ps_script = os.path.join(SKILLS_DIR, "devsecops-hardening-audit", "scripts", "win-security-audit.ps1")
                proc = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_script],
                                      capture_output=True, text=True)
                try:
                    self.send_json(json.loads(proc.stdout))
                except Exception:
                    self.send_json({"raw_output": proc.stdout, "error": proc.stderr})
            else:
                sh_script = os.path.join(SKILLS_DIR, "linux-sysadmin-senior", "scripts", "linux-cis-hardening.sh")
                proc = subprocess.run(["bash", sh_script], capture_output=True, text=True)
                self.send_json({"raw_output": proc.stdout, "status": "ok"})
            return

        super().do_GET()

    def do_POST(self):
        path = self.path.split("?")[0]
        if sys.platform.startswith("win"):
            ps_repair = os.path.join(SKILLS_DIR, "windows-sysadmin-senior", "scripts", "win-quick-repair.ps1")
            ps_startup = os.path.join(SKILLS_DIR, "windows-sysadmin-senior", "scripts", "win-startup-optimize.ps1")

            if path == "/api/action/clean-temp":
                proc = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_repair, "-Action", "CleanTemp"],
                                      capture_output=True, text=True)
                try:
                    self.send_json(json.loads(proc.stdout))
                except Exception:
                    self.send_json({"status": "ok", "detail": proc.stdout})
                return

            if path == "/api/action/flush-dns":
                proc = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_repair, "-Action", "FlushDNS"],
                                      capture_output=True, text=True)
                try:
                    self.send_json(json.loads(proc.stdout))
                except Exception:
                    self.send_json({"status": "ok", "detail": proc.stdout})
                return

            if path == "/api/action/optimize-startup":
                proc = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_startup],
                                      capture_output=True, text=True)
                try:
                    self.send_json(json.loads(proc.stdout))
                except Exception:
                    self.send_json({"status": "ok", "detail": proc.stdout})
                return

            if path == "/api/action/restore-startup":
                proc = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps_startup, "-RestoreLatest"],
                                      capture_output=True, text=True)
                try:
                    self.send_json(json.loads(proc.stdout))
                except Exception:
                    self.send_json({"status": "ok", "detail": proc.stdout})
                return

        self.send_json({"error": "Unsupported action on this platform"}, status=400)

def main():
    server = HTTPServer(("127.0.0.1", PORT), SysAdminApiHandler)
    url = f"http://127.0.0.1:{PORT}/"
    print("==================================================================")
    print("  SENIOR SYSADMIN & DEVSECOPS - INTERFACE GRAPHIQUE (PYTHON)")
    print("==================================================================")
    print(f"  URL Locale : {url}")
    print("  Appuyez sur Ctrl+C pour arreter le serveur.")
    print("==================================================================")
    
    if "--no-browser" not in sys.argv:
        webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArret du serveur.")
        server.server_close()

if __name__ == "__main__":
    main()
