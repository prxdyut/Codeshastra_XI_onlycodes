from flask import request, jsonify
from app.tools import network_tools

def register(app):
    # 📍 GET Public IP
    # @app.route('/network/ip/public', methods=['GET'])
    # def public_ip():
    #     return jsonify(network_tools.get_public_ip())

    # 📍 POST: Resolve Domain to IP
    @app.route('/network/ip/resolve', methods=['POST'])
    def hostname_to_ip():
        data = request.get_json()
        domain = data.get("domain")
        return jsonify(network_tools.resolve_hostname(domain))

    # 📍 POST: Reverse DNS Lookup
    @app.route('/network/ip/reverse', methods=['POST'])
    def reverse_dns():
        data = request.get_json()
        ip = data.get("ip")
        return jsonify(network_tools.reverse_dns(ip))

    # 📍 POST: DNS Lookup (A, MX, TXT, etc.)
    @app.route('/network/dns', methods=['POST'])
    def dns_lookup():
        data = request.get_json()
        domain = data.get("domain")
        record_type = data.get("type", "A")
        return jsonify(network_tools.get_dns_record(domain, record_type))

    # 📍 POST: Ping
    @app.route('/network/ping', methods=['POST'])
    def ping_host():
        data = request.get_json()
        host = data.get("host")
        count = int(data.get("count", 4))
        return jsonify(network_tools.ping(host, count))

    # 📍 POST: Traceroute
    @app.route('/network/traceroute', methods=['POST'])
    def traceroute_host():
        data = request.get_json()
        host = data.get("host")
        return jsonify(network_tools.traceroute(host))
