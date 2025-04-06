from flask import request, jsonify
from app.tools.domain_lookup import lookup_domain

def register(app):
    @app.route('/api/lookup/domain', methods=['POST'])
    def lookup_domain_endpoint():
        data = request.get_json()
        domain = data.get('domain')
        if not domain:
            return jsonify({"error": "Missing domain"}), 400
        return jsonify(lookup_domain(domain))
