from flask import request, jsonify
from app.tools.time_converter import convert_timezone_logic, list_timezones

def register(app):
    @app.route('/api/convert-timezone', methods=['POST', 'OPTIONS'])
    def convert_timezone_endpoint():
        if request.method == 'OPTIONS':
            return {'success': True}  # Handle preflight request
            
        data = request.json
        time_str = data.get('time')
        from_tz = data.get('from_timezone')
        to_tz = data.get('to_timezone')

        if not all([time_str, from_tz, to_tz]):
            return jsonify({"error": "Missing parameters"}), 400

        result = convert_timezone_logic(time_str, from_tz, to_tz)
        return jsonify(result)

    @app.route('/api/list-timezones', methods=['GET', 'OPTIONS'])
    def list_timezones_endpoint():
        if request.method == 'OPTIONS':
            return {'success': True}  # Handle preflight request
            
        return jsonify({"timezones": list_timezones()})
