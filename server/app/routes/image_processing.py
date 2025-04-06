from flask import request, send_file, jsonify
from PIL import Image
import io
from app.tools.image_processing import convert_image_format


def register(app):
    @app.route("/api/resize-image", methods=["POST"])
    def resize_image():
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400

        try:
            # Read the image
            img = Image.open(file.stream)

            # Get resize parameters
            width = request.form.get("width", type=int)
            height = request.form.get("height", type=int)
            maintain_aspect = (
                request.form.get("maintainAspectRatio", "true").lower() == "true"
            )

            if maintain_aspect:
                # Calculate new dimensions maintaining aspect ratio
                orig_width, orig_height = img.size
                ratio = min(width / orig_width, height / orig_height)
                new_width = int(orig_width * ratio)
                new_height = int(orig_height * ratio)
            else:
                new_width = width
                new_height = height

            # Resize image
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Save to buffer
            buf = io.BytesIO()
            save_format = img.format or "PNG"
            resized_img.save(buf, format=save_format)
            buf.seek(0)

            return send_file(
                buf,
                mimetype=f"image/{save_format.lower()}",
                as_attachment=True,
                download_name=f"resized_image.{save_format.lower()}",
            )

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/convert-image", methods=["POST"])
    def convert_image():
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        input_format = file.filename.split(".")[-1]
        output_format = request.form.get("output_format")

        if not output_format:
            return jsonify({"error": "Missing output_format parameter"}), 400

        # Optional resizing parameters
        try:
            width = (
                int(request.form.get("width")) if request.form.get("width") else None
            )
            height = (
                int(request.form.get("height")) if request.form.get("height") else None
            )
        except ValueError:
            return jsonify({"error": "Width and height must be integers"}), 400

        result_stream, error = convert_image_format(
            file.stream, input_format, output_format, width, height
        )

        if error:
            return jsonify({"error": error}), 500

        return send_file(
            result_stream,
            mimetype=f"image/{output_format}",
            as_attachment=True,
            download_name=f"converted.{output_format}",
        )
