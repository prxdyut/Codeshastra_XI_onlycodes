from flask import request, jsonify
from app.tools.markdown_formatting import (
    format_markdown_logic,
    format_yaml,
    format_xml,
    format_toml
)

def register(app):
    @app.route('/api/format-markdown', methods=['POST'])
    def markdown_format_one():
        text = request.json.get("text", "")
        result = format_markdown_logic(text)
        return jsonify(result)

    @app.route('/api/format-yaml', methods=['POST'])
    def yaml_format():
        text = request.json.get("text", "")
        result = format_yaml(text)
        return jsonify(result)

    @app.route('/api/format-xml', methods=['POST'])
    def xml_format():
        text = request.json.get("text", "")
        result = format_xml(text)
        return jsonify(result)

    @app.route('/api/format-toml', methods=['POST'])
    def toml_format():
        text = request.json.get("text", "")
        result = format_toml(text)
        return jsonify(result)
