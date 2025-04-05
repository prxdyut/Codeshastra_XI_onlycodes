
import os
from docx import Document
from fpdf import FPDF
from PyPDF2 import PdfReader, PdfWriter
from docx2pdf import convert as docx_to_pdf_converter
from pdf2docx import Converter as PdfToDocxConverter

def convert_docx_to_pdf(docx_path, output_path):
    try:
        docx_to_pdf_converter(docx_path, output_path)
        return True, "Conversion successful"
    except Exception as e:
        return False, str(e)

def convert_pdf_to_docx(pdf_path, output_path):
    try:
        cv = PdfToDocxConverter(pdf_path)
        cv.convert(output_path)
        cv.close()
        return True, "Conversion successful"
    except Exception as e:
        return False, str(e)

def generate_pdf_from_text(text, output_path):
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.set_font("Arial", size=12)
        for line in text.splitlines():
            pdf.multi_cell(0, 10, line)
        pdf.output(output_path)
        return True, "PDF generated successfully"
    except Exception as e:
        return False, str(e)

def compress_pdf(input_path, output_path):
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.add_metadata(reader.metadata)
        with open(output_path, "wb") as f:
            writer.write(f)
        return True, "PDF compressed successfully"
    except Exception as e:
        return False, str(e)
