from flask import request, jsonify
from app.tools.qrcode import generate_qr_code

def register(app):
    @app.route("/api/qr-generator", methods=["POST"])
    def qr_generator():
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' field"}), 400
        
        box_size = data.get("box_size", 10)
        border = data.get("border", 4)
        qr_image = generate_qr_code(data["text"], box_size, border)
        return jsonify({"qr_code": qr_image})
