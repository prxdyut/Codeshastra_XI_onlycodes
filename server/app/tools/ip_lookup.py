import requests

def lookup_ip(ip):
    url = f"https://geo.ipify.org/api/v2/country,city?apiKey=at_KPqy95qzgCHAjAacYaE03kgrHFaAL&ipAddress={ip}"
    response = requests.get(url)
    return response.json()
