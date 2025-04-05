from flask import request, send_file, jsonify
from app.tools.image_processing import convert_image_format

def register(app):
    @app.route('/api/convert-image', methods=['POST'])
    def convert_image():
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        input_format = file.filename.split('.')[-1]
        output_format = request.form.get('output_format')

        if not output_format:
            return jsonify({'error': 'Missing output_format parameter'}), 400

        # Optional resizing parameters
        try:
            width = int(request.form.get('width')) if request.form.get('width') else None
            height = int(request.form.get('height')) if request.form.get('height') else None
        except ValueError:
            return jsonify({'error': 'Width and height must be integers'}), 400

        result_stream, error = convert_image_format(file.stream, input_format, output_format, width, height)

        if error:
            return jsonify({'error': error}), 500

        return send_file(
            result_stream,
            mimetype=f'image/{output_format}',
            as_attachment=True,
            download_name=f'converted.{output_format}'
        )
