# app/routes/documents_tools.py

from flask import request, jsonify
from werkzeug.utils import secure_filename
import os

from tools import document_tools

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def register(app):
    @app.route("/api/docx-to-pdf", methods=["POST"])
    def docx_to_pdf_route():
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files['file']
        filename = secure_filename(file.filename)
        docx_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(docx_path)
        output_path = os.path.join(UPLOAD_FOLDER, filename.rsplit('.', 1)[0] + ".pdf")
        success, message = document_tools.convert_docx_to_pdf(docx_path, output_path)
        if success:
            return jsonify({"message": message, "output_file": output_path}), 200
        return jsonify({"error": message}), 500

    @app.route("/api/pdf-to-docx", methods=["POST"])
    def pdf_to_docx_route():
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files['file']
        filename = secure_filename(file.filename)
        pdf_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(pdf_path)
        output_path = os.path.join(UPLOAD_FOLDER, filename.rsplit('.', 1)[0] + ".docx")
        success, message = document_tools.convert_pdf_to_docx(pdf_path, output_path)
        if success:
            return jsonify({"message": message, "output_file": output_path}), 200
        return jsonify({"error": message}), 500

    @app.route("/api/text-to-pdf", methods=["POST"])
    def text_to_pdf_route():
        data = request.get_json()
        text = data.get("text", "")
        output_path = os.path.join(UPLOAD_FOLDER, "generated.pdf")
        success, message = document_tools.generate_pdf_from_text(text, output_path)
        if success:
            return jsonify({"message": message, "output_file": output_path}), 200
        return jsonify({"error": message}), 500

    @app.route("/api/compress-pdf", methods=["POST"])
    def compress_pdf_route():
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files['file']
        filename = secure_filename(file.filename)
        input_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(input_path)
        output_path = os.path.join(UPLOAD_FOLDER, filename.rsplit('.', 1)[0] + "_compressed.pdf")
        success, message = document_tools.compress_pdf(input_path, output_path)
        if success:
            return jsonify({"message": message, "output_file": output_path}), 200
        return jsonify({"error": message}), 500
