import json

def format_json_logic(input_json: str):
    try:
        parsed = json.loads(input_json)
        formatted = json.dumps(parsed, indent=4, sort_keys=True)
        return { "success": True, "formatted": formatted }
    except json.JSONDecodeError as e:
        return { "success": False, "error": f"Invalid JSON: {str(e)}" }