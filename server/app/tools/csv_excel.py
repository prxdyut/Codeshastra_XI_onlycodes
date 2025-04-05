import pandas as pd
from io import StringIO, BytesIO

def convert_csv_to_excel(csv_content: str):
    try:
        df = pd.read_csv(StringIO(csv_content))
        output = BytesIO()
        df.to_excel(output, index=False, engine='openpyxl')
        output.seek(0)
        return {"success": True, "data": output}
    except Exception as e:
        return {"success": False, "error": str(e)}

def convert_excel_to_csv(file):
    try:
        df = pd.read_excel(file)
        csv_data = df.to_csv(index=False)
        return {"success": True, "data": csv_data}
    except Exception as e:
        return {"success": False, "error": str(e)}
