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
    // console.log(pong)
}

async function handlePing(msg, remote) {
    let ping = Ping.prototype.decode(msg);
    console.log('decode ping');
    // console.log(ping);
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
    privateKey = Utils.genPrivateKey();
    privateKey = 'e97acb74a5bff3ff2dd0c04c9f337112cd1fead7f7eee7463aeb2d9930da1a18';
    privateKey = Buffer.from(privateKey, 'hex');
    let source = Config.source;

    try {
        let ping = new Ping({
            source: source,
            target: target,
            udpSocket: udpSocket,
            privateKey: privateKey
        })
        // await ping.send();
        let nodeId = Utils.getNodeId(privateKey);
        console.log(`nodeId: ${nodeId.length}`);
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
// main();

async function testDis(){
    let targetNodeId = 'aa34b3a6c61f3ea12387612b20fb2bc71d0a121649f08c3d9c5c1174b3baf52f99e2e5572aa5e1bcdc9a42c7e7c11d62b9985be6a44dd1164da2f5c0455ead65';

    console.log(Buffer.from(targetNodeId, 'hex').length)
    return ;

    let farString = '';
    let closeString = '';
    // let closest = Utils.calculateDistance('1111111111111111111111111111111111111111111111111111111111111111', 
    // '0000000000000000000000000000000000000000000000000000000000000000');

    for(var i=0;i<64;i++) {
        farString += String.fromCharCode(255);
    }
    for(var i=0;i<64;i++) {
        closeString += String.fromCharCode(0);
    }
    let closest = Utils.calculateDistance(farString, closeString);

    console.log(closest);
    console.log(Math.pow(2, 256) - 1);
    return ;
    let privateKey = Utils.genPrivateKey();
    let nodeId = Utils.getNodeId(privateKey);
    let dis = Utils.calculateDistance(targetNodeId, nodeId);
    while(true) {
        privateKey = Utils.genPrivateKey();
        nodeId = Utils.getNodeId(privateKey);
        dis = Utils.calculateDistance(targetNodeId, nodeId);
        if(dis < closest){
            console.log(dis);
            closest = dis;
        }
    }
}

testDis();