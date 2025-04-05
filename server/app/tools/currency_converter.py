import requests

def convert_currency(amount, from_currency, to_currency):
    try:
        url = "https://api.exchangerate-api.com/v4/latest/" + from_currency
        response = requests.get(url)
        data = response.json()

        if 'rates' not in data:
            raise Exception("Unable to fetch exchange rates")

        rate = data['rates'].get(to_currency)
        if rate is None:
            raise Exception(f"No rate found for {to_currency}")

        converted_amount = float(amount) * rate

        return {
            "success": True,
            "from": from_currency,
            "to": to_currency,
            "original_amount": amount,
            "converted_amount": round(converted_amount, 2),
            "rate": rate
        }
    except requests.RequestException as e:
        raise Exception(f"API request failed: {str(e)}")
    except (KeyError, ValueError) as e:
        raise Exception(f"Data processing error: {str(e)}")