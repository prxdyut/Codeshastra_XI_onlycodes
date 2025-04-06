import requests

def lookup_domain(domain):
    url = f"https://geo.ipify.org/api/v2/country,city?apiKey={at_KPqy95qzgCHAjAacYaE03kgrHFaAL}&domain={domain}"
    response = requests.get(url)
    return response.json()
