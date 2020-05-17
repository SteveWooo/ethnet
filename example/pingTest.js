const Ping = require(`${__dirname}/../models/Ping`);
const Pong = require(`${__dirname}/../models/Pong`);
const Utils = require(`${__dirname}/../models/Utils`);
const secp256k1 = require('secp256k1'); // 签名用
const ethUtils = require('ethereumjs-util');
const keccak256 = ethUtils.keccak256; // 哈希用
const crypto = require('crypto');
const eccrypto = require('eccrypto');
const dgram = require('dgram');
const net = require('net');
const fs = require('fs');

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
    // console.log('decode ping');
    // console.log(ping);
    let pong = new Pong({
        ping : ping,
        privateKey : privateKey,
        udpSocket: udpSocket,
        target : target
    })
    await pong.send();

    // let tcpClient = new net.Socket();
    // tcpClient.connect(target.tcpport, target.ip, function(){
    //     console.log('connected');
    // })
}

async function pingTarget(pk) {
    target = getTarget();
    privateKey = pk || Utils.genPrivateKey();
    
    privateKey = myPrivateKey;
    privateKey = Buffer.from(privateKey, 'hex');
    let source = Config.source;

    try {
        let ping = new Ping({
            source: source,
            target: target,
            udpSocket: udpSocket,
            privateKey: privateKey
        })
        await ping.send();
        return ;
        console.log(ethUtils)
        let nodeId = Utils.getNodeId(privateKey);
        console.log(`nodeId: ${nodeId}`);
        console.log(`nodeIdHash: ${keccak256(nodeId).toString('hex')}`);
        console.log(`ethUtiHash: ${ethUtils.keccak256(Buffer.from(nodeId, 'hex')).toString('hex')}`)
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
                console.log(data.toString('hex'));

                eccrypto.decrypt(Buffer.from(myPrivateKey, 'hex'), Buffer.from(data, 'hex')).then(msg=>{
                    console.log(msg);
                }).catch(e=>{
                    console.log(e)
                });

                // let file = [];
                // for(var i=0;i<data.length;i++) {
                //     let str = `${i}: ${data[i]} ${data[i].toString(16)} ${String.fromCharCode(data[i])}`;
                //     file.push(str);
                // }
                // fs.writeFileSync(`${__dirname}/../tcphandshakeDemo`, file.join('\n'));
            })
        })

        server.listen(config.source.tcpport, function(){
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
    // console.log(ethUtils)
}
main();

let targetNodeId = '8061b96e7eb6dfbb16f30a172a9ab13566d973c59b36b0f32e66a2c518ed004986cd43389312b30d708b24b7f8610d9d735b54c296082dc07abcec26d5adf0eb';
let myPrivateKey = 'e97acb74a5bff3ff2dd0c04c9f337112cd1fead7f7eee7463aeb2d9930da1a18';
async function testDis(){
    // init
    udpSocket = await initUdpSocket(Config);
    tcpSocket = await initTcpSocket(Config);
    let farString = '';
    let closeString = '';
    for(var i=0;i<128;i++) {
        farString += 'f';
    }
    for(var i=0;i<128;i++) {
        closeString += '0'
    }
    // let closest = Utils.calculateDistance(farString, closeString);
    let closest = Utils.getLogicBucket(farString, closeString);

    // 找距离接近的ID
    /**
     *  let data = '130 231 67 74 9 94 188 159 234 113 150 204 103 180 193 130 195 58 143 84 141 182 100 70 254 96 128 167 68 22 117 170'.split(' ')
        for(var i=0;i<data.length;i++){
            data[i] = parseInt(data[i]).toString(16)
            if(data[i].length == 1){
                data[i] = '0' + data[i];
            }
        }
        data.join('')
        // 其实是这个：82e7434a095ebc9fea7196cc67b4c182c33a8f548db66446fe6080a7441675aa
     */
    
    
    // 生成的publickey（geth也是）： 57e3e4ee0e2f3ca50784ef4d745aeea6e3865ef14d1d11edb28b2e44526065f861c610b31ec3debbbdb6f9e4a4f553aa309849f5495a5976b1a0fac5a881ac7b
    // hash 前：[87 227 228 238 14 47 60 165 7 132 239 77 116 90 238 166 227 134 94 241 77 29 17 237 178 139 46 68 82 96 101 248 97 198 16 179 30 195 222 187 189 182 249 228 164 245 83 170 48 152 73 245 73 90 89 118 177 160 250 197 168 129 172 123]
    // 即： 57e3e4ee0e2f3ca50784ef4d745aeea6e3865ef14d1d11edb28b2e44526065f861c610b31ec3debbbdb6f9e4a4f553aa309849f5495a5976b1a0fac5a881ac7b
    // 在geth显示的NodeId sha（用来算距离的）： eba0b2856e435a8d51cbd841b53825ddc0113e991fc2f1fe18dbe13bc237a161
    // 上面的hash [235 160 178 133 110 67 90 141 81 203 216 65 181 56 37 221 192 17 62 153 31 194 241 254 24 219 225 59 194 55 161 97]

    let _privateKey = '';
    let nodeId = '';
    let bucketNumber = 0;
    while(true) {
        _privateKey = Utils.genPrivateKey();
        nodeId = Utils.getNodeId(_privateKey);

        bucketNumber = Utils.getLogicBucket(targetNodeId, nodeId);
        if(bucketNumber > closest) {
            continue ;
        }
        closest = bucketNumber;
        console.log(`privateKey: ${_privateKey.toString('hex')}`)
        console.log(`nodeId: ${nodeId}, buckerNum: ${bucketNumber}`);
        // _privateKey = "a61765cfee9f2df380cac41f575400a4b824116b17e2549b416001ac3a8c55ff";
        // _privateKey = Buffer.from(_privateKey, 'hex');
        pingTarget(_privateKey);
        break;
    }
}
// testDis();

async function targetTest(){
    udpSocket = await initUdpSocket(Config);
    tcpSocket = await initTcpSocket(Config);
    let nodeId = Utils.getNodeId(Buffer.from(myPrivateKey, 'hex'));
    bucketNumber = Utils.getLogicBucket(targetNodeId, nodeId);
    console.log(`nodeId: ${nodeId}, buckerNum: ${bucketNumber}`);
    pingTarget(myPrivateKey);
}

// targetTest();