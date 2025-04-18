import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from flask import Flask
from flask_cors import CORS

# Now import from app.routes
from routes import (
    json_formatter,
    image_processing,
    password_tools,
    network_tools,
    csv_excel,
    random_tools,
    code_formatting,
    markdown_formatting,
    api_tester,
    markdown_formatting,
    link_shortner,
    qrcode,
    currency_converter,
    time_converter,
    document_tools,
    domain_lookup,
    ip_lookup,
    email_lookup,
    audio_converter,
    tts_service,
)

app = Flask(__name__)
CORS(app)

# json_formatter.register(app)
password_tools.register(app)
network_tools.register(app)
json_formatter.register(app)
csv_excel.register(app)
random_tools.register(app)
code_formatting.register(app)
image_processing.register(app)
api_tester.register(app)
markdown_formatting.register(app)
link_shortner.register(app)
qrcode.register(app)
currency_converter.register(app)
time_converter.register(app)
document_tools.register(app)
ip_lookup.register(app)
domain_lookup.register(app)
email_lookup.register(app)
audio_converter.register(app)
tts_service.register(app)


@app.route("/")
def home():
    return {"message": "DevTools API running 🎯"}


if __name__ == "__main__":
    app.run(debug=True)
