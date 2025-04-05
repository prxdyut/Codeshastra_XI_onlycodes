from flask import request, jsonify
from app.tools.currency_converter import convert_currency

def register(app):
    @app.route('/api/currency-convert', methods=['POST', 'OPTIONS'])
    def convert_currency_endpoint():
        if request.method == 'OPTIONS':
            return {'success': True}
            
        try:
            data = request.get_json()
            amount = data.get("amount")
            from_currency = data.get("from")
            to_currency = data.get("to")

            if not all([amount is not None, from_currency, to_currency]):
                return jsonify({
                    "success": False,
                    "error": "Missing required fields. Need amount, from, and to currency."
                }), 400

            result = convert_currency(amount, from_currency, to_currency)
            return jsonify(result)

        except Exception as e:
            return jsonify({
                "success": False,
                "error": str(e)
            }), 500
