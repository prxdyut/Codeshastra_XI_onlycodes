import random
import uuid
import hashlib

def generate_random_number(min_val: int, max_val: int, seed: str = None):
    rng = random.Random(seed) if seed else random
    return rng.randint(min_val, max_val)

def generate_uuid_v4():
    return str(uuid.uuid4())

def generate_uuid_v5(namespace: str, name: str):
    try:
        ns_uuid = uuid.UUID(namespace)
        return str(uuid.uuid5(ns_uuid, name))
    except ValueError:
        return None

def roll_dice(notation="1d6", seed: str = None):
    try:
        rolls, sides = map(int, notation.lower().split("d"))
        rng = random.Random(seed) if seed else random
        result = [rng.randint(1, sides) for _ in range(rolls)]
        return result
    except:
        return None

def flip_coin(seed: str = None):
    rng = random.Random(seed) if seed else random
    return rng.choice(["Heads", "Tails"])
