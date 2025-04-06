from flask import request, jsonify
from app.tools.email_lookup import lookup_email

def register(app):
    @app.route('/api/email-lookup', methods=['POST'])
    def email_lookup():
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({"error": "Missing email"}), 400
        return jsonify(lookup_email(email))
