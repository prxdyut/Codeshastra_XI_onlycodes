from flask import request, jsonify
from app.tools.currency_converter import convert_currency

def register(app):
    @app.route('/api/currency-convert', methods=['POST'])
    def convert_currency_endpoint():
        try:
            data = request.get_json()
            amount = data.get("amount")
            from_currency = data.get("from")
            to_currency = data.get("to")

            if not all([amount, from_currency, to_currency]):
                return jsonify({"error": "Missing required fields"}), 400

            result = convert_currency(amount, from_currency, to_currency)
            return jsonify(result)

        except Exception as e:
            return jsonify({"error": str(e)}), 500
