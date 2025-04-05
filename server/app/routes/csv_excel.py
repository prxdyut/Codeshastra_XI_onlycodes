from flask import request, jsonify, send_file
from app.tools.csv_excel import convert_csv_to_excel, convert_excel_to_csv

from io import BytesIO

def register(app):
    @app.route('/convert/csv-to-excel', methods=['POST'])
    def csv_to_excel():
        csv_data = request.form.get('csv')
        if not csv_data:
            return jsonify({"success": False, "error": "Missing CSV data"}), 400

        result = convert_csv_to_excel(csv_data)
        if result["success"]:
            return send_file(
                result["data"],
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name="converted.xlsx"
            )
        return jsonify(result), 400

    @app.route('/api/excel-to-csv', methods=['POST'])
    def excel_to_csv():
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400

        file = request.files['file']
        result = convert_excel_to_csv(file)
        if result["success"]:
            return jsonify({"success": True, "csv": result["data"]})
        return jsonify(result), 400
