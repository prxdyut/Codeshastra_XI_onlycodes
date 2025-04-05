from PIL import Image
import io
import os

try:
    import cairosvg
except ImportError:
    cairosvg = None

def convert_image_format(file_stream, input_format: str, output_format: str, width=None, height=None):
    input_format = input_format.lower()
    output_format = output_format.lower()

    try:
        if input_format == 'svg':
            if cairosvg is None:
                return None, "cairosvg is not installed"
            output_bytes = io.BytesIO()

            if output_format == 'png':
                cairosvg.svg2png(file_obj=file_stream, write_to=output_bytes, output_width=width, output_height=height)
            elif output_format in ['jpg', 'jpeg']:
                png_data = io.BytesIO()
                cairosvg.svg2png(file_obj=file_stream, write_to=png_data, output_width=width, output_height=height)
                png_data.seek(0)
                img = Image.open(png_data).convert("RGB")
                if width and height:
                    img = img.resize((width, height))
                img.save(output_bytes, format="JPEG")
            else:
                return None, f"Unsupported output format for SVG: {output_format}"
            output_bytes.seek(0)
            return output_bytes, None

        # For non-SVG formats
        img = Image.open(file_stream)

        if width and height:
            img = img.resize((width, height))

        if output_format in ['jpg', 'jpeg'] and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        output_bytes = io.BytesIO()
        img.save(output_bytes, format=output_format.upper())
        output_bytes.seek(0)
        return output_bytes, None

    except Exception as e:
        return None, str(e)
