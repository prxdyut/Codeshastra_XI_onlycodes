from flask import request, jsonify
from app.tools.password_tools import generate_password_logic  # ✅ this is correct


def register(app):
    @app.route('/generate/password', methods=['GET'])
    def generate_password():
        length = int(request.args.get('length', 12))
        return generate_password_logic(length)