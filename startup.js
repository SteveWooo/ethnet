/**
 * 比如：rlp.encode('127.0.0.1')
 */
const rlp = require('rlp');
const crypto = require('crypto');
const secp256k1 = require('secp256k1'); // 签名用
const keccak256 = require('keccak256'); // 哈希用
const dgram = require('dgram');
const fs = require('fs');
const net = require('net');
const config = {
    localHost : '127.0.0.1',
    localPort : 30301
}

/**
 * 把一个ip变成4段数字
 */
function ipaddress(ip){
    let buf = Buffer.alloc(4);
    ip = ip.split('.');
    for(var i=0;i<ip.length;i++) {
        buf[i] = Buffer.from(String.fromCharCode(parseInt(ip[i])));
    }
    return buf;
}

let udpServer;
async function initSock(){
    udpServer = dgram.createSocket('udp4');
    udpServer.on('listening', function(){
        console.log('listen udp')
    })
    udpServer.on('message', function(msg, remote){
        console.log('recive:');
        console.log(msg);
        // let resultFile = [];

        // for(var i=0;i<msg.length;i++) {
        //     resultFile.push(`${i}位: ${msg[i]} - ${String.fromCharCode(msg[i])}`);
        // }
        // fs.writeFileSync(`${__dirname}/receiveData`, resultFile.join('\n'));
    })
    udpServer.bind(config.localPort, config.localHost);
}

async function ping(ip, tcpport, udpport) {
    let endpointFrom = [];
    //ip
    endpointFrom.push(ipaddress(config.localHost));
    //udpport
    endpointFrom.push(config.localPort);
    //tcpport
    endpointFrom.push(config.localPort);

    let endpointTo = [];
    //ip
    endpointTo.push(ipaddress(ip));
    //udpport
    endpointTo.push(udpport);
    //tcpport
    endpointTo.push(tcpport);

    let version = 0x03;
    let packetType = 1;
    let time = +new Date();
    // 转换成秒级，再加60秒时间给他到达目标
    time = Math.floor(time / 1000) + 60;
    // 数据包
    let packSouce = [
        version,
        endpointFrom,
        endpointTo,
        time
    ]
    console.log(packSouce)

    let encodePack = rlp.encode(packSouce);
    // console.log(encodePack);
    // for(var i=0;i<encodePack.length;i++) {
    //     console.log(`${encodePack[i]} : ${String.fromCharCode(encodePack[i])}`)
    // }


    let packetTypeBuffer = Buffer.from(String.fromCharCode(packetType));
    let pack = Buffer.concat([packetTypeBuffer, encodePack]);
    // pack = pack.toString(); // 转字符串好处理，buffer很难拼接

    // hashid
    let privateKey = crypto.randomBytes(32);
    let publicKey = secp256k1.publicKeyCreate(privateKey);

    // 签名 signature, recid
    let sign = secp256k1.ecdsaSign(keccak256(pack), privateKey);
    let signBuffer = Buffer.from(sign.signature);
    // 拼签名
    // pack = signBuffer.toString() + recid + pack;
    pack = Buffer.concat([signBuffer, Buffer.from(String.fromCharCode(sign.recid)), pack]);

    let packHash = keccak256(pack);
    // 拼哈希
    // pack = packHash.toString() + pack;
    pack = Buffer.concat([packHash, pack]);
    let sendFile = [];
    // for(var i=0;i<pack.length;i++) {
    //     sendFile.push(`${i}位: ${pack[i]} - ${String.fromCharCode(pack[i])}`);
    // }
    // fs.writeFileSync(`${__dirname}/sentData`, sendFile.join('\n'));

    // let udpClient = dgram.createSocket('udp4');
    udpServer.send(Buffer.from(pack), udpport, ip, function(){
        console.log('sent');
    })
}

async function main(){
    await initSock();
    try{
        await ping('127.0.0.1', 30303, 30303);
    }catch(e) {
        console.log(e);
    }
}
main();