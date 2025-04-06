from flask import request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
from app.tools.audio_converter import AudioConverter

def register(app):
    @app.route('/api/convert', methods=['POST'])
    def convert_audio():
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if not AudioConverter.allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        output_format = request.form.get('format', 'wav').lower()
        sample_rate = request.form.get('sample_rate', type=int)
        
        if output_format not in AudioConverter.SUPPORTED_OUTPUT_FORMATS:
            return jsonify({'error': f'Unsupported format. Supported: {AudioConverter.SUPPORTED_OUTPUT_FORMATS}'}), 400
        
        filename = secure_filename(file.filename)
        input_path = os.path.join('uploads', filename)
        file.save(input_path)
        
        output_path, error = AudioConverter.convert_audio(input_path, output_format, sample_rate)
        os.remove(input_path)
        
        if error:
            return jsonify({'error': error}), 500
        
        return send_file(
            output_path,
            mimetype=f'audio/{output_format}',
            as_attachment=True,
            download_name=f'converted.{output_format}'
        )

    @app.route('/api/formats', methods=['GET'])
    def get_supported_formats():
        return jsonify({
            'input_formats': list(AudioConverter.ALLOWED_EXTENSIONS),
            'output_formats': AudioConverter.SUPPORTED_OUTPUT_FORMATS
        })