import string, random
from flask import jsonify

def generate_password_logic(length=12):
    chars = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(random.choices(chars, k=length))
    return jsonify({ 'password': password })