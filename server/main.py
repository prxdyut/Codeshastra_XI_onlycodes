import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))


from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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
