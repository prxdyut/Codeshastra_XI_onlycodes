import markdown
import yaml
import xml.dom.minidom
import toml

def format_markdown_logic(text):
    """Converts markdown text to HTML."""
    try:
        html = markdown.markdown(text)
        return {"success": True, "html": html}
    except Exception as e:
        return {"success": False, "error": str(e)}

def format_yaml(text):
    """Validates and returns pretty YAML."""
    try:
        parsed = yaml.safe_load(text)
        pretty = yaml.dump(parsed, sort_keys=False)
        return {"success": True, "formatted": pretty}
    except Exception as e:
        return {"success": False, "error": str(e)}

def format_xml(text):
    """Validates and prettifies XML."""
    try:
        parsed = xml.dom.minidom.parseString(text)
        pretty = parsed.toprettyxml()
        return {"success": True, "formatted": pretty}
    except Exception as e:
        return {"success": False, "error": str(e)}

def format_toml(text):
    """Validates and pretty prints TOML."""
    try:
        parsed = toml.loads(text)
        pretty = toml.dumps(parsed)
        return {"success": True, "formatted": pretty}
    except Exception as e:
        return {"success": False, "error": str(e)}
