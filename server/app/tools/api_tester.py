import requests
import time
import json
from jsonschema import validate, ValidationError

def test_api_request(data: dict):
    try:
        url = data.get("url")
        method = data.get("method", "GET").upper()
        headers = data.get("headers", {})
        params = data.get("params", {})
        body = data.get("body", None)
        timeout = int(data.get("timeout", 10))
        follow_redirects = data.get("follow_redirects", True)
        repeat = int(data.get("repeat", 1))
        schema = data.get("validate_schema", None)
        auth_type = data.get("auth_type", None)
        auth_credentials = data.get("auth", {})

        # 🧩 Authentication
        auth = None
        if auth_type == "basic":
            auth = (auth_credentials.get("username"), auth_credentials.get("password"))
        elif auth_type == "bearer":
            headers["Authorization"] = f"Bearer {auth_credentials.get('token')}"
        elif auth_type == "api_key":
            if auth_credentials.get("location") == "header":
                headers[auth_credentials.get("key")] = auth_credentials.get("value")
            elif auth_credentials.get("location") == "query":
                params[auth_credentials.get("key")] = auth_credentials.get("value")

        responses = []
        total_time = 0.0
        redirect_count = 0

        for _ in range(repeat):
            start = time.time()
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                data=body if headers.get("Content-Type") != "application/json" else None,
                json=json.loads(body) if headers.get("Content-Type") == "application/json" and isinstance(body, str) else None,
                timeout=timeout,
                allow_redirects=follow_redirects,
                auth=auth,
            )
            elapsed = round((time.time() - start) * 1000, 2)
            total_time += elapsed
            redirect_count += len(response.history)

            result = {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.text,
                "elapsed_ms": elapsed,
                "url": response.url,
            }

            # ✅ Optional schema validation
            if schema:
                try:
                    response_json = response.json()
                    validate(instance=response_json, schema=schema)
                    result["schema_valid"] = True
                except (ValidationError, json.JSONDecodeError) as e:
                    result["schema_valid"] = False
                    result["schema_error"] = str(e)

            responses.append(result)

        return {
            "average_time_ms": round(total_time / repeat, 2),
            "total_requests": repeat,
            "redirects_total": redirect_count,
            "results": responses if repeat > 1 else responses[0]
        }, None

    except Exception as e:
        return None, f"Request Error: {str(e)}"
