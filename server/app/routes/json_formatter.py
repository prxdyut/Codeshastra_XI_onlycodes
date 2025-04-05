from flask import request, jsonify
# from app.tools import format_json_logic
from app.tools.json_formatter import format_json_logic

def register(app):
    @app.route('/json/format', methods=['POST'])
    def format_json():
        data = request.get_json()
        raw_json = data.get("json", "")

        result = format_json_logic(raw_json)
        return jsonify(result)
