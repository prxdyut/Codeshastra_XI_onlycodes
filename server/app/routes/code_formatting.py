from flask import request, jsonify
from app.tools.code_formatting import (
    format_python_code,
    format_html_css_js,
    format_generic
)

def register(app):
    @app.route('/code/format', methods=['POST'])
    def format_code():
        data = request.json
        code = data.get('code')
        language = data.get('language', '').lower()

        if not code or not language:
            return jsonify({"error": "Missing 'code' or 'language' field"}), 400

        if language == 'python':
            result, error = format_python_code(code)
        elif language in ['html', 'css', 'javascript', 'js']:
            result, error = format_html_css_js(code, language)
        else:
            result, error = format_generic(code, language)

        if error:
            return jsonify({"error": error}), 500

        return jsonify({"formatted_code": result})
