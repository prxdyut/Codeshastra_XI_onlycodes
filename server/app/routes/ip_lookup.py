from flask import request, jsonify
from app.tools.ip_lookup import lookup_ip

def register(app):
    @app.route('/api/lookup/ip', methods=['POST'])
    def lookup_ip_endpoint():
        data = request.get_json()
        ip = data.get('ip')
        if not ip:
            return jsonify({"error": "Missing IP"}), 400
        return jsonify(lookup_ip(ip))
