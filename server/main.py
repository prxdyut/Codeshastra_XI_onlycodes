import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
# Update CORS configuration to allow all origins and methods
CORS(
    app,
    resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type"],
            "allow_credentials": True,
            "max_age": 3600,
        }
    },
)

# Update imports to be more resilient
imports = [
    "json_formatter",
    "image_processing",
    "password_tools",
    "network_tools",
    "csv_excel",
    "random_tools",
    "code_formatting",
    "markdown_formatting",
    "api_tester",
    "link_shortner",
    "qrcode",
    "email_lookup",
    "currency_converter",  # Add this
    "time_converter",  # Add this
]

# Dynamically import and register routes
for module_name in imports:
    try:
        module = __import__(f"routes.{module_name}", fromlist=["register"])
        module.register(app)
    except ImportError as e:
        print(f"Warning: Could not import {module_name}: {e}")
        continue


@app.route("/")
def home():
    return {"message": "DevTools API running 🎯"}


if __name__ == "__main__":
    app.run(debug=True)
