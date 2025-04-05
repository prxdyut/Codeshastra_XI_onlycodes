import socket
import requests
import platform
import subprocess
import dns.resolver
import time  # Add this import
from datetime import datetime
import re
import concurrent.futures


# ------------------------------
# 🔹 IP Address Utilities
# ------------------------------
def get_public_ip():
    try:
        # Get basic IP
        ip = requests.get("https://api.ipify.org").text

        # Get detailed info from ip-api.com
        details = requests.get(f"http://ip-api.com/json/{ip}").json()

        # Get additional info from ipapi.co
        more_details = requests.get(f"https://ipapi.co/{ip}/json/").json()

        # Get organization info from ipinfo.io (free tier)
        org_details = requests.get(f"https://ipinfo.io/{ip}/json").json()

        return {
            "ip": ip,
            "location": {
                "city": details.get("city"),
                "region": details.get("regionName"),
                "country": details.get("country"),
                "country_code": more_details.get("country_code"),
                "postal": details.get("zip"),
                "coordinates": {
                    "latitude": details.get("lat"),
                    "longitude": details.get("lon"),
                },
                "timezone": details.get("timezone"),
                "currency": more_details.get("currency"),
                "languages": more_details.get("languages", "").split(","),
            },
            "network": {
                "asn": f"AS{details.get('as', '').split()[0].replace('AS', '')}",
                "org": org_details.get("org"),
                "isp": details.get("isp"),
                "hostname": socket.getfqdn(ip),
                "as_name": more_details.get("asn"),
                "as_domain": more_details.get("org"),
            },
            "connection": {
                "type": more_details.get("network") or "Unknown",
                "mobile": details.get("mobile", False),
                "proxy": details.get("proxy", False),
                "hosting": details.get("hosting", False),
                "security": {
                    "tor": more_details.get("security", {}).get("tor", False),
                    "proxy": more_details.get("security", {}).get("proxy", False),
                    "crawler": more_details.get("security", {}).get("crawler", False),
                },
            },
            "timezone": {
                "id": details.get("timezone"),
                "current_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "offset": more_details.get("utc_offset"),
                "daylight_saving": more_details.get("timezone_dst", False),
            },
        }
    except Exception as e:
        print(f"Error in IP lookup: {str(e)}")  # For debugging
        return {"public_ip": ip}  # Fallback to basic response


def resolve_hostname(domain):
    try:
        ip = socket.gethostbyname(domain)
        return {"domain": domain, "ip": ip}
    except Exception as e:
        return {"error": str(e)}


def reverse_dns(ip_address):
    try:
        host = socket.gethostbyaddr(ip_address)
        return {"ip": ip_address, "hostname": host[0]}
    except Exception as e:
        return {"error": str(e)}


# ------------------------------
# 🔹 DNS Lookup
# ------------------------------
def get_dns_record(domain, record_type="A"):
    try:
        results = {
            "domain": domain,
            "records": [],
            "all_records": {},
            "whois": None,
            "dns_health": {
                "has_ns": False,
                "has_mx": False,
                "has_spf": False,
                "has_dmarc": False,
            },
        }

        # Get all common record types
        record_types = ["A", "AAAA", "MX", "NS", "TXT", "SOA", "CNAME"]

        # Get primary requested record
        try:
            answers = dns.resolver.resolve(domain, record_type)
            results["records"] = [str(r) for r in answers]
        except Exception:
            results["records"] = []

        # Get all other record types
        for rt in record_types:
            try:
                answers = dns.resolver.resolve(domain, rt)
                results["all_records"][rt] = [str(r) for r in answers]

                # Check DNS health
                if rt == "NS" and answers:
                    results["dns_health"]["has_ns"] = True
                elif rt == "MX" and answers:
                    results["dns_health"]["has_mx"] = True
                elif rt == "TXT":
                    txt_records = [str(r) for r in answers]
                    results["dns_health"]["has_spf"] = any(
                        "v=spf1" in txt for txt in txt_records
                    )

                # Check DMARC
                try:
                    dmarc_answers = dns.resolver.resolve(f"_dmarc.{domain}", "TXT")
                    results["dns_health"]["has_dmarc"] = any(
                        "v=DMARC1" in str(r) for r in dmarc_answers
                    )
                except Exception:
                    pass

            except Exception:
                results["all_records"][rt] = []

        # Get response times from nameservers
        try:
            ns_response_times = []
            nameservers = results["all_records"].get("NS", [])
            resolver = dns.resolver.Resolver()
            resolver.timeout = 2  # 2 second timeout
            resolver.lifetime = 2  # 2 second lifetime

            for ns in nameservers:
                try:
                    ns_ip = resolver.resolve(ns, "A")[0].to_text()
                    resolver.nameservers = [ns_ip]
                    start_time = time.time()
                    resolver.resolve(domain, "A")
                    response_time = round((time.time() - start_time) * 1000, 2)
                    ns_response_times.append(
                        {"nameserver": ns, "response_time_ms": response_time}
                    )
                except Exception:
                    ns_response_times.append(
                        {"nameserver": ns, "response_time_ms": None}
                    )
            results["nameserver_response_times"] = ns_response_times
        except Exception as e:
            print(f"Error getting nameserver response times: {str(e)}")
            results["nameserver_response_times"] = []

        return results
    except Exception as e:
        return {"error": str(e)}


# ------------------------------
# 🔹 Ping
# ------------------------------
def is_valid_host(host):
    """Validate if the host is a valid domain name or IP address."""
    # Check if it's an IP address
    try:
        socket.inet_aton(host)  # Check IPv4
        return True
    except:
        pass

    # Check if it's a valid domain name
    domain_pattern = (
        r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
    )
    return bool(re.match(domain_pattern, host))


def ping(host, count=4):
    # Validate input
    if not host or not is_valid_host(host):
        return {
            "error": "Invalid host. Please enter a valid domain name or IP address",
            "host": host,
            "status": "failed",
        }

    if not isinstance(count, int) or count < 1 or count > 20:
        count = 4  # Default to 4 if invalid

    param = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        start_time = time.time()
        result = subprocess.check_output(
            ["ping", param, str(count), host], stderr=subprocess.STDOUT, text=True
        )

        # Parse ping statistics
        lines = result.splitlines()
        statistics = {
            "host": host,
            "raw_output": result,
            "packets": {
                "transmitted": 0,
                "received": 0,
                "lost": 0,
                "loss_percentage": 0,
            },
            "times": [],
            "min_time": None,
            "max_time": None,
            "avg_time": None,
            "total_time": round(time.time() - start_time, 2),
            "resolved_ip": None,
        }

        try:
            statistics["resolved_ip"] = socket.gethostbyname(host)
        except:
            pass

        for line in lines:
            if "bytes=" in line.lower():
                try:
                    time_ms = float(line.split("time=")[1].split("ms")[0].strip())
                    statistics["times"].append(time_ms)
                except:
                    continue

            if (
                "packets transmitted" in line.lower()
                or "packets: sent = " in line.lower()
            ):
                try:
                    if platform.system().lower() == "windows":
                        # Windows format
                        parts = line.split(",")
                        statistics["packets"]["transmitted"] = int(
                            parts[0].split("=")[1].strip()
                        )
                        statistics["packets"]["received"] = int(
                            parts[1].split("=")[1].strip()
                        )
                        statistics["packets"]["lost"] = (
                            statistics["packets"]["transmitted"]
                            - statistics["packets"]["received"]
                        )
                    else:
                        # Unix format
                        parts = line.split(",")
                        statistics["packets"]["transmitted"] = int(parts[0].split()[0])
                        statistics["packets"]["received"] = int(parts[1].split()[0])
                        statistics["packets"]["lost"] = (
                            statistics["packets"]["transmitted"]
                            - statistics["packets"]["received"]
                        )
                except:
                    continue

        if statistics["times"]:
            statistics["min_time"] = min(statistics["times"])
            statistics["max_time"] = max(statistics["times"])
            statistics["avg_time"] = sum(statistics["times"]) / len(statistics["times"])

        if statistics["packets"]["transmitted"] > 0:
            statistics["packets"]["loss_percentage"] = round(
                (statistics["packets"]["lost"] / statistics["packets"]["transmitted"])
                * 100,
                1,
            )

        return statistics
    except subprocess.CalledProcessError as e:
        return {
            "error": e.output,
            "host": host,
            "status": "failed",
            "message": "Host unreachable or invalid",
        }


# ------------------------------
# 🔹 Traceroute
# ------------------------------
def get_ip_info(ip: str):
    """Get basic IP info without rate limiting issues"""
    try:
        response = requests.get(
            f"http://ip-api.com/json/{ip}?fields=country,city,isp", timeout=2
        )
        return response.json() if response.status_code == 200 else {}
    except:
        return {}


def parse_traceroute(output: str):
    """Parse traceroute/tracert output into structured data"""
    hops = []
    if platform.system().lower() == "windows":
        # Windows tracert format
        pattern = r"\s*(\d+)\s+(<?\d+\s*ms|\*)\s+(<?\d+\s*ms|\*)\s+(<?\d+\s*ms|\*)\s+([^\[]*)(?:\[([\d.]+)\])?.*"
    else:
        # Unix traceroute format
        pattern = r"\s*(\d+)\s+(?:([^\s]+)\s+\(([\d.]+)\)|(\*))(?:\s+(\d+(?:\.\d+)?)?\s*ms)?(?:\s+(\d+(?:\.\d+)?)?\s*ms)?(?:\s+(\d+(?:\.\d+)?)?\s*ms)?"

    lines = output.strip().split("\n")
    start_time = time.time()

    for line in lines:
        if (
            "Reply from" in line
            or "Unable to resolve" in line
            or "Tracing route" in line
            or "over a maximum" in line
        ):
            continue

        match = re.match(pattern, line.strip())
        if match:
            if platform.system().lower() == "windows":
                hop_num, time1, time2, time3, hostname, ip = match.groups()
                times = [
                    t.replace("<", "").replace(" ms", "")
                    for t in [time1, time2, time3]
                    if t != "*"
                ]
                times = [float(t) for t in times if t]
            else:
                groups = match.groups()
                hop_num = groups[0]
                hostname = groups[1] if groups[1] else "*"
                ip = groups[2] if groups[2] else hostname if hostname != "*" else None
                times = [float(t) for t in groups[4:7] if t]

            hop = {
                "hop": int(hop_num),
                "host": hostname.strip() if hostname and hostname != "*" else None,
                "ip": ip,
                "times": times,
                "avg_time": round(sum(times) / len(times), 2) if times else None,
                "min_time": round(min(times), 2) if times else None,
                "max_time": round(max(times), 2) if times else None,
                "packet_loss": (
                    round((3 - len(times)) / 3 * 100, 1)
                    if platform.system().lower() == "windows"
                    else None
                ),
            }
            hops.append(hop)

    # Enrich with geolocation data (in parallel)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # Create futures for all IPs
        ip_futures = {
            executor.submit(get_ip_info, hop["ip"]): i
            for i, hop in enumerate(hops)
            if hop["ip"]
        }

        # Use as_completed instead of as_done
        for future in concurrent.futures.as_completed(ip_futures):
            idx = ip_futures[future]
            try:
                ip_data = future.result(timeout=3)  # Add timeout for safety
                if ip_data:
                    hops[idx].update(
                        {
                            "country": ip_data.get("country"),
                            "city": ip_data.get("city"),
                            "isp": ip_data.get("isp"),
                        }
                    )
            except Exception as e:
                print(f"Error getting IP info: {str(e)}")
                continue

    return {
        "hops": hops,
        "total_hops": len(hops),
        "execution_time": round(time.time() - start_time, 2),
        "complete": any(hop["ip"] for hop in hops[-3:]),
    }


def traceroute(host):
    """Enhanced traceroute with validation and rich data"""
    if not is_valid_host(host):
        return {
            "error": "Invalid host. Please enter a valid domain name or IP address",
            "host": host,
            "status": "failed",
        }

    try:
        # Resolve hostname first
        try:
            resolved_ip = socket.gethostbyname(host)
        except:
            resolved_ip = None

        # Different command construction for Windows vs Unix
        if platform.system().lower() == "windows":
            command = ["tracert", "-h", "30", host]  # -h sets max hops
        else:
            command = ["traceroute", "-w", "2", host]

        result = subprocess.check_output(
            command,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=60,  # Add timeout to prevent hanging
        )

        parsed_result = parse_traceroute(result)
        return {
            "host": host,
            "resolved_ip": resolved_ip,
            "raw_output": result,
            **parsed_result,
        }
    except subprocess.TimeoutExpired:
        return {
            "error": "Traceroute timed out",
            "host": host,
            "status": "failed",
            "message": "Operation took too long to complete",
        }
    except subprocess.CalledProcessError as e:
        return {
            "error": str(e.output),
            "host": host,
            "status": "failed",
            "message": "Failed to execute traceroute",
        }
    except Exception as e:
        return {
            "error": str(e),
            "host": host,
            "status": "failed",
            "message": "Unexpected error occurred",
        }
