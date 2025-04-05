import hashlib

# In-memory store (for demo only; use Redis/DB in production)
short_to_url = {}
url_to_short = {}

def shorten_url(original_url: str, base_url: str = "http://localhost:5000/u/") -> str:
    if original_url in url_to_short:
        return url_to_short[original_url]

    short_code = hashlib.md5(original_url.encode()).hexdigest()[:6]
    short_url = f"{base_url}{short_code}"
    short_to_url[short_code] = original_url
    url_to_short[original_url] = short_url
    return short_url

def resolve_url(short_code: str) -> str | None:
    return short_to_url.get(short_code)
