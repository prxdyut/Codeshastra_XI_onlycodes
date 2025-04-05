import socket
import requests
import platform
import subprocess
import dns.resolver


# ------------------------------
# 🔹 IP Address Utilities
# ------------------------------
def get_public_ip():
    try:
        ip = requests.get('https://api.ipify.org').text
        return { "public_ip": ip }
    except Exception as e:
        return { "error": str(e) }

def resolve_hostname(domain):
    try:
        ip = socket.gethostbyname(domain)
        return { "domain": domain, "ip": ip }
    except Exception as e:
        return { "error": str(e) }

def reverse_dns(ip_address):
    try:
        host = socket.gethostbyaddr(ip_address)
        return { "ip": ip_address, "hostname": host[0] }
    except Exception as e:
        return { "error": str(e) }


# ------------------------------
# 🔹 DNS Lookup
# ------------------------------
def get_dns_record(domain, record_type):
    try:
        answers = dns.resolver.resolve(domain, record_type, raise_on_no_answer=False)
        return {
            "domain": domain,
            "type": record_type,
            "records": [str(r) for r in answers]
        }
    except Exception as e:
        return { "error": str(e) }


# ------------------------------
# 🔹 Ping
# ------------------------------
def ping(host, count=4):
    param = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        result = subprocess.check_output(["ping", param, str(count), host], stderr=subprocess.STDOUT, text=True)
        return { "host": host, "result": result }
    except subprocess.CalledProcessError as e:
        return { "error": e.output }


# ------------------------------
# 🔹 Traceroute
# ------------------------------
def traceroute(host):
    command = "tracert" if platform.system().lower() == "windows" else "traceroute"
    try:
        result = subprocess.check_output([command, host], stderr=subprocess.STDOUT, text=True)
        return { "host": host, "result": result }
    except subprocess.CalledProcessError as e:
        return { "error": e.output }
