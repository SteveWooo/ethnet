/**
 * 比如：rlp.encode('127.0.0.1')
 */
const rlp = require('rlp');
/**
 * 比如：console.log(struct.pack('>H', 30303));
 */
const struct = require('python-struct');
const dgram = require('dgram');
const net = require('net');

async function initSock(){
    let udpServer = dgram.createServer('udp4');
    udpServer.bind(30301);
}

async function ping(ip, tcpport, udpport) {
    let endpointFrom = [];
    //ip
    endpointFrom.push('127.0.0.1');
    //udpport
    endpointFrom.push(struct.pack('>H', 10001));
    //tcpport
    endpointFrom.push(struct.pack('>H', 10002));

    let endpointTo = [];
    //ip
    endpointTo.push(ip);
    //udpport
    endpointTo.push(struct.pack('>H', udpport));
    //tcpport
    endpointTo.push(struct.pack('>H', tcpport));

    let version = 0x03;
    let packetType = 0x01;
    let time = +new Date();
    // 转换成秒级，再加60秒时间给他到达目标
    time = Math.floor(time / 1000) + 60;
    // 数据包
    let packSouce = [
        version,
        ...endpointFrom,
        ...endpointTo,
        struct.pack('I', time)
    ]

    console.log(packSouce);
    let encodePack = rlp.encode(packSouce);
    let packetTypeBuffer = Buffer.alloc(1);
    packetTypeBuffer[0] = packetType;

    let pack = Buffer.concat([packetTypeBuffer, encodePack]);
    console.log(pack)
    // console.log(rlp.encode('127.0.0.1'))
}

async function main(){
    // await initSock();
    await ping('127.0.0.1', 30303, 30304);
}
main();