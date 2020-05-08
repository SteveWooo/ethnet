const Ping = require(`${__dirname}/../models/Ping`);
const Pong = require(`${__dirname}/../models/Pong`);
const Utils = require(`${__dirname}/../models/Utils`);
const secp256k1 = require('secp256k1'); // 签名用
const keccak256 = require('keccak256'); // 哈希用
const crypto = require('crypto');
const dgram = require('dgram');
const net = require('net');

const rlp = require('rlp');

const Config = {
    source : {
        ip : '127.0.0.1',
        udpport : 30304,
        tcpport : 30304
    }
}

/**
 * 处理geth返回的pong数据包
 */
async function handlePong(msg, remote) {
    let pong = Pong.prototype.decode(msg);
    console.log(pong)
}

async function handlePing(msg, remote) {
    let ping = Ping.prototype.decode(msg);
    console.log('decode ping');
    console.log(ping);
    let pong = new Pong({
        ping : ping,
        privateKey : privateKey,
        udpSocket: udpSocket,
        target : target
    })
    await pong.send();
}

async function pingTarget() {
    target = getTarget();
    privateKey = Utils.getPk();
    let source = Config.source;

    try {
        let ping = new Ping({
            source: source,
            target: target,
            udpSocket: udpSocket,
            privateKey: privateKey
        })
        await ping.send();
    } catch (e) {
        console.log(e)
    }
}

function initUdpSocket(config){
    return new Promise(resolve=>{
        let server = dgram.createSocket('udp4');
        server.on('message', async function (msg, remote) {
            // console.log(msg);
            // console.log(`receive PackType : ${msg[97]}`);
            let packType = msg[97];
            // pong包
            if(packType == 2) {
                console.log('receive pong');
                // await handlePong(msg, remote);
            }
            if(packType == 1) {
                console.log('receive ping');
                await handlePing(msg, remote);
            }
        })
        server.on('listening', async function () {
            console.log(`udp listen at ${config.source.udpport}`);
            resolve(server);
        })
        server.bind(config.source.udpport, config.source.ip);
    })
}
function initTcpSocket(config){
    return new Promise(resolve=>{
        let server = net.createServer(function(socket){
            console.log('some one connect me !!!!!!!');
            socket.on('data', function(data){
                console.log('tcp get data:');
                console.log(data.toString());
            })
        })

        server.listen(config.tcpport, function(){
            console.log(`tcp listen at ${config.source.tcpport}`);
            resolve(server);
        })
    })
}

function getTarget(){
    let target = {
        ip: '127.0.0.1',
        udpport: 30303,
        tcpport: 30303
    }
    return target;
}

/**
 * 这些大家一起用，进程内保持统一
 */
let udpSocket;
let tcpSocket;
let privateKey;
let target;
async function main() {
    udpSocket = await initUdpSocket(Config);
    tcpSocket = await initTcpSocket(Config);
    await pingTarget();
}
main();


/**
 * 目标：找到私钥和NodeId的关系，进而能够用NodeId进行XOR运算距离，计算K桶位置
 * 找距离：
 * NodeId: c89eb0f5ac95c96bc0ccfbfc74279924a6ebef063a27ecd42bf136b670e84b6c77d3890882790a49689eb4c632b81ac4fcf143a5f6ae36e959990c0b5bb32b06
 * 公钥: 2,200,158,176,245,172,149,201,107,192,204,251,252,116,39,153,36,166,235,239,6,58,39,236,212,43,241,54,182,112,232,75,108
 */