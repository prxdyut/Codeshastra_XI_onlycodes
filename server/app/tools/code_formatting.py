import autopep8
import jsbeautifier

def format_python_code(code: str):
    try:
        formatted_code = autopep8.fix_code(code)
        return formatted_code, None
    except Exception as e:
        return None, str(e)

def format_html_css_js(code: str, language: str):
    try:
        opts = jsbeautifier.default_options()
        opts.indent_size = 2
        if language in ['js', 'javascript']:
            return jsbeautifier.beautify(code, opts), None
        elif language in ['html', 'css']:
            return jsbeautifier.beautify(code, opts), None
        else:
            return None, f"Unsupported language for jsbeautifier: {language}"
    except Exception as e:
        return None, str(e)

def format_generic(code: str, language: str):
    return None, f"Formatting for '{language}' not supported with pure Python tools"
