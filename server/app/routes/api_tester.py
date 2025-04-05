from flask import request, jsonify
from app.tools.api_tester import test_api_request

def register(app):
    @app.route('/api/test-endpoint', methods=['POST'])
    def test_endpoint():
        data = request.get_json()

        if not data or 'url' not in data:
            return jsonify({"error": "Missing URL"}), 400

        result, error = test_api_request(data)
        if error:
            return jsonify({"error": error}), 500
        return jsonify(result)
