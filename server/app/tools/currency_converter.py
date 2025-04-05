import requests

def convert_currency(amount, from_currency, to_currency):
    url = f"https://api.exchangerate.host/convert"
    params = {
        'from': from_currency,
        'to': to_currency,
        'amount': amount
    }
    response = requests.get(url, params=params)
    data = response.json()

    if response.status_code != 200 or not data.get("success"):
        raise Exception("Currency conversion failed.")

    return {
        "from": from_currency,
        "to": to_currency,
        "original_amount": amount,
        "converted_amount": data["result"],
        "rate": data["info"]["rate"]
    }