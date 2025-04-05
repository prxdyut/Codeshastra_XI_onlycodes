from flask import request, jsonify
from app.tools.time_converter import convert_timezone_logic, list_timezones

def register(app):
    @app.route('/api/convert-timezone', methods=['POST'])
    def convert_timezone_endpoint():
        data = request.json
        time_str = data.get('time')
        from_tz = data.get('from_timezone')
        to_tz = data.get('to_timezone')

        if not all([time_str, from_tz, to_tz]):
            return jsonify({"error": "Missing parameters"}), 400

        result = convert_timezone_logic(time_str, from_tz, to_tz)
        return jsonify(result)

    @app.route('/api/list-timezones', methods=['GET'])
    def list_timezones_endpoint():
        return jsonify(list_timezones())
