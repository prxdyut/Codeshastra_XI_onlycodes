import dns.resolver
import re
import requests
from concurrent.futures import ThreadPoolExecutor
import socket


def validate_email_format(email: str) -> bool:
    """Basic email format validation"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def check_mx_records(domain: str) -> list:
    """Check MX records for the domain"""
    try:
        mx_records = dns.resolver.resolve(domain, "MX")
        return [str(mx.exchange).rstrip(".") for mx in mx_records]
    except Exception:
        return []


def check_spf_record(domain: str) -> dict:
    """Check SPF record"""
    try:
        txt_records = dns.resolver.resolve(domain, "TXT")
        spf_records = [str(record) for record in txt_records if "v=spf1" in str(record)]
        return {
            "has_spf": bool(spf_records),
            "spf_record": spf_records[0] if spf_records else None,
        }
    except Exception:
        return {"has_spf": False, "spf_record": None}


def check_dmarc_record(domain: str) -> dict:
    """Check DMARC record"""
    try:
        dmarc_domain = f"_dmarc.{domain}"
        txt_records = dns.resolver.resolve(dmarc_domain, "TXT")
        dmarc_records = [
            str(record) for record in txt_records if "v=DMARC1" in str(record)
        ]
        return {
            "has_dmarc": bool(dmarc_records),
            "dmarc_record": dmarc_records[0] if dmarc_records else None,
        }
    except Exception:
        return {"has_dmarc": False, "dmarc_record": None}


def lookup_email(email: str) -> dict:
    """Main email lookup function"""
    if not validate_email_format(email):
        return {"success": False, "error": "Invalid email format"}

    domain = email.split("@")[1]
    local_part = email.split("@")[0]

    result = {
        "email": email,
        "domain": domain,
        "format_valid": True,
        "mx_records": [],
        "email_security": {},
        "domain_info": {},
    }

    # Parallel checks using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=3) as executor:
        mx_future = executor.submit(check_mx_records, domain)
        spf_future = executor.submit(check_spf_record, domain)
        dmarc_future = executor.submit(check_dmarc_record, domain)

        # Get MX records
        result["mx_records"] = mx_future.result()

        # Check if domain has valid mail server
        result["has_mail_server"] = len(result["mx_records"]) > 0

        # Get SPF and DMARC records
        result["email_security"] = {**spf_future.result(), **dmarc_future.result()}

    # Calculate security score
    security_score = 0
    if result["has_mail_server"]:
        security_score += 40
    if result["email_security"].get("has_spf"):
        security_score += 30
    if result["email_security"].get("has_dmarc"):
        security_score += 30
    result["security_score"] = security_score

    # Try to get domain info
    try:
        response = requests.get(
            f"http://ip-api.com/json/{socket.gethostbyname(domain)}"
        )
        if response.status_code == 200:
            data = response.json()
            result["domain_info"] = {
                "ip": data.get("query"),
                "isp": data.get("isp"),
                "org": data.get("org"),
                "country": data.get("country"),
                "region": data.get("regionName"),
                "city": data.get("city"),
            }
    except Exception:
        pass

    result["success"] = True
    return result
