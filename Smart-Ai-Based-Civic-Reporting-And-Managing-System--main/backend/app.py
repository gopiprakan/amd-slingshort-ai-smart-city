import sys
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS

# Ensure project root is on sys.path so "backend" and "models" imports work
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Import blueprints after path setup
from backend.routes import complaint_bp
from backend.workforce_routes import workforce_bp

# Create Flask app
app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(complaint_bp)
app.register_blueprint(workforce_bp)


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "running",
        "message": "Smart City AI backend is active"
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
