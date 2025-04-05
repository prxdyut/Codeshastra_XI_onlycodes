import requests

def lookup_by_email(email, api_key):
    url = f"https://geo.ipify.org/api/v2/country?apiKey={at_KPqy95qzgCHAjAacYaE03kgrHFaAL}&email={email}"
    response = requests.get(url)
    return response.json()