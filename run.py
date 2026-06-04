"""Start the Milk Tea Shop server (Flask + XML database)."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from backend.app import app  # noqa: E402

if __name__ == "__main__":
    print("Milk Tea Shop running at http://127.0.0.1:5000")
    print("  Guest entry:  http://127.0.0.1:5000/guest.html")
    print("  Admin login:  admin / admin123")
    print("  XML data:     data/xml/")
    app.run(host="127.0.0.1", port=5000, debug=True)