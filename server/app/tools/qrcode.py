import qrcode
import io
import base64

def generate_qr_code(data: str, box_size: int = 10, border: int = 4):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    # Return as base64 string for API usage
    img_base64 = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{img_base64}"
