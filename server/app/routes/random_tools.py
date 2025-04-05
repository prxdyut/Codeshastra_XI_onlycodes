from flask import request, jsonify
from app.tools.random_tools import (
    generate_random_number,
    generate_uuid_v4,
    generate_uuid_v5,
    roll_dice,
    flip_coin
)

def register(app):
    @app.route('/random/number', methods=['GET'])
    def random_number():
        min_val = int(request.args.get('min', 0))
        max_val = int(request.args.get('max', 100))
        seed = request.args.get('seed')
        number = generate_random_number(min_val, max_val, seed)
        return jsonify({"number": number})

    @app.route('/random/uuid/v4', methods=['GET'])
    def uuid_v4():
        return jsonify({"uuid": generate_uuid_v4()})

    @app.route('/random/uuid/v5', methods=['GET'])
    def uuid_v5():
        namespace = request.args.get('namespace')
        name = request.args.get('name')
        uuid5 = generate_uuid_v5(namespace, name)
        if uuid5:
            return jsonify({"uuid": uuid5})
        return jsonify({"error": "Invalid namespace UUID"}), 400

    @app.route('/random/dice', methods=['GET'])
    def dice_roll():
        notation = request.args.get('notation', '1d6')
        seed = request.args.get('seed')
        result = roll_dice(notation, seed)
        if result:
            return jsonify({"result": result})
        return jsonify({"error": "Invalid dice notation"}), 400

    @app.route('/random/coin', methods=['GET'])
    def coin_flip():
        seed = request.args.get('seed')
        return jsonify({"flip": flip_coin(seed)})
