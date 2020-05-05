from secp256k1 import PrivateKey
k = PrivateKey(None)
f = open("priv_key", 'w')
f.write(k.serialize())
f.close()
