from secp256k1 import PrivateKey

priv_key_file = open('priv_key', 'r')
priv_key_serialized = priv_key_file.read()
priv_key_file.close()

priv_key = PrivateKey()
priv_key.deserialize(priv_key_serialized)
sig = priv_key.ecdsa_sign_recoverable('asdasd', raw=True)
print sig

