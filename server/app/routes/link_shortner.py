from flask import request, jsonify, redirect
from app.tools.link_shortner import shorten_url, resolve_url

def register(app):
    @app.route("/api/shorten-url", methods=["POST"])
    def shorten():
        data = request.get_json()
        if not data or "url" not in data:
            return jsonify({"error": "Missing 'url'"}), 400
        short = shorten_url(data["url"])
        return jsonify({"short_url": short})

    @app.route("/u/<short_code>")
    def redirect_to_url(short_code):
        original = resolve_url(short_code)
        if original:
            return redirect(original)
        return jsonify({"error": "Short link not found"}), 404
