import os
import sys

from web.app import app, init_application

if __name__ == "__main__":
    init_application()
    app.run(host="0.0.0.0", port=5000, debug=True)