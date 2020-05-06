const Ping = require(`${__dirname}/../models/Ping`);
const secp256k1 = require('secp256k1'); // 签名用
const keccak256 = require('keccak256'); // 哈希用
const crypto = require('crypto');
const dgram = require('dgram');
const config = {
    source : {
        ip : '127.0.0.1',
        udpport : 30301,
        tcpport : 30301
    }
}
function initSocket(){
    let server = dgram.createSocket('udp4');
    server.on('message', function (msg, remote) {
        console.log('receive');
        console.log(msg);
    })
    server.on('listening', function () {
        console.log(`listen at ${config.source.udpport}`);
    })
    server.bind(config.source.udpport, config.source.ip);
    return server;
}
function getTarget(){
    let target = {
        ip: '127.0.0.1',
        udpport: 30303,
        tcpport: 30303
    }
    return target;
}
function getPk(){
    let privateKey = crypto.randomBytes(32);
    return privateKey;
}

async function main(){
    let socket = initSocket();
    let target = getTarget();
    let privateKey = getPk();
    let source = config.source;

    let ping = new Ping({
        source: source,
        target: target,
        socket: socket,
        privateKey: privateKey
    })
    ping.send();
}
main();
