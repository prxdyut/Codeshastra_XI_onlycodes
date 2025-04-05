from flask import request, jsonify
from app.tools.email_lookup import lookup_by_email

def register(app):
    @app.route('/api/lookup/email', methods=['POST'])
    def lookup_email_endpoint():
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({"error": "Missing email"}), 400
        return jsonify(lookup_by_email(email))
