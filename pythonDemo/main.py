import socket
import threading
import time
import struct
import rlp
from secp256k1 import PrivateKey
from ipaddress import ip_address
import hashlib
import _pysha3
# from _pysha3 import keccak_256
import math

def keccak256(s):
    k = _pysha3.keccak_256()
    k.update(s)
    return k.digest()

class EndPoint(object):
    def __init__(self, address, udpPort, tcpPort):
        self.address = ip_address(address)
        self.udpPort = udpPort
        self.tcpPort = tcpPort

    def pack(self):
        return [self.address.packed,
                struct.pack(">H", self.udpPort),
                struct.pack(">H", self.tcpPort)]

class PingNode(object):
    packet_type = bytes([1]);
    version = '\x03';
    def __init__(self, endpoint_from, endpoint_to):
        self.endpoint_from = endpoint_from
        self.endpoint_to = endpoint_to

    def pack(self):
        return [self.version,
                self.endpoint_from.pack(),
                self.endpoint_to.pack(),
                struct.pack(">I", math.ceil(time.time()) + 60)]

class PingServer(object):
    def __init__(self, my_endpoint):
        self.endpoint = my_endpoint

        priv_key_file = open('priv_key', 'r')
        priv_key_serialized = priv_key_file.read()
        priv_key_file.close()
        self.priv_key = PrivateKey()
        self.priv_key.deserialize(priv_key_serialized)

        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(('0.0.0.0', self.endpoint.udpPort))


    def wrap_packet(self, packet):
        payload = packet.packet_type + rlp.encode(packet.pack())
        sig = self.priv_key.ecdsa_sign_recoverable(keccak256(payload), raw = True)
        sig_serialized = self.priv_key.ecdsa_recoverable_serialize(sig)
        payload = sig_serialized[0] + bytes(sig_serialized[1]) + payload

        payload_hash = keccak256(payload)
        return payload_hash + payload

    def udp_listen(self):
        def receive_ping():
            print("listening...")
            data, addr = self.sock.recvfrom(1024)
            print("received message[", addr, "]")
 
        return threading.Thread(target = receive_ping)

    def ping(self, endpoint):
        ping = PingNode(self.endpoint, endpoint)
        message = self.wrap_packet(ping)
        print("sending ping.")
        self.sock.sendto(message, (endpoint.address.exploded, endpoint.udpPort))

my_endpoint = EndPoint(u'127.0.0.1', 30302, 30302)
their_endpoint = EndPoint(u'127.0.0.1', 30301, 30301)

server = PingServer(my_endpoint)

listen_thread = server.udp_listen()
listen_thread.start()

server.ping(their_endpoint)