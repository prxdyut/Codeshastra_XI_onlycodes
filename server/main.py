import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))


from flask import Flask
from flask_cors import CORS

# Now import from app.routes
from routes import json_formatter, password_tools ,network_tools , csv_excel, random_tools , code_formatting

app = Flask(__name__)
CORS(app)

# json_formatter.register(app)
password_tools.register(app)
network_tools.register(app)
json_formatter.register(app)
csv_excel.register(app)
random_tools.register(app)
code_formatting.register(app)

@app.route('/')
def home():
    return { 'message': 'DevTools API running 🎯' }

if __name__ == '__main__':
    app.run(debug=True)
