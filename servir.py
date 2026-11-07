"""Servidor local para esta copia del frontend. Requiere Python 3."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import os

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

class SPAHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path != '/' and not Path(path).suffix:
            self.path = '/index.html'
        super().do_GET()

if __name__ == '__main__':
    print('Abre http://localhost:8080', flush=True)
    try:
        ThreadingHTTPServer(('127.0.0.1', 8080), SPAHandler).serve_forever()
    except KeyboardInterrupt:
        print('\nServidor detenido.')
