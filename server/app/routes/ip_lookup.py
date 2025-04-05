from flask import request, jsonify
from app.tools.ip_lookup import lookup_ip

def register(app):
    @app.route('/api/lookup/ip', methods=['POST'])
    def lookup_ip_endpoint():
        data = request.get_json()
        ip = data.get('ip')
        api_key = data.get('api_key')
        if not ip or not api_key:
            return jsonify({"error": "Missing IP or API key"}), 400
        return jsonify(lookup_ip(ip, api_key))
