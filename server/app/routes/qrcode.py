from flask import send_file, request
from app.tools.qrcode import generate_qrcode_image

def register(app):
    @app.route("/api/generate-qrcode", methods=["GET"])
    def generate_qrcode_endpoint():
        text = request.args.get("text")
        if not text:
            return {"error": "Missing text parameter"}, 400

        img_io = generate_qrcode_image(text)
        return send_file(img_io, mimetype='image/png', as_attachment=False, download_name="qrcode.png")
