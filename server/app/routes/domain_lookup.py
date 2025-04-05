from flask import request, jsonify
from app.tools.domain_lookup import lookup_domain

def register(app):
    @app.route('/api/lookup/domain', methods=['POST'])
    def lookup_domain_endpoint():
        data = request.get_json()
        domain = data.get('domain')
        api_key = data.get('api_key')
        if not domain or not api_key:
            return jsonify({"error": "Missing domain or API key"}), 400
        return jsonify(lookup_domain(domain, api_key))
