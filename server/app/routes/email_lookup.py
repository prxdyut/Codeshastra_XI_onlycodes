from flask import request, jsonify
from app.tools.email_lookup import lookup_email

def register(app):
    @app.route('/api/email-lookup', methods=['POST'])
    def email_lookup():
        data = request.get_json()

        if not data or 'email' not in data:
            return jsonify({"error": "Missing email address"}), 400

        result = lookup_email(data['email'])
        if not result.get('success'):
            return jsonify({"error": result.get('error', 'Unknown error')}), 400
            
        return jsonify(result)
