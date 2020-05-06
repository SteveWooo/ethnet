const Ping = require(`${__dirname}/../models/Ping`);
const secp256k1 = require('secp256k1'); // 签名用
const keccak256 = require('keccak256'); // 哈希用
const crypto = require('crypto');
const dgram = require('dgram');
const Config = {
    source : {
        ip : '127.0.0.1',
        udpport : 30304,
        tcpport : 30304
    }
}

function initSocket(config){
    return new Promise(resolve=>{
        let server = dgram.createSocket('udp4');
        server.on('message', async function (msg, remote) {
            console.log('receive');
            console.log(msg);
            console.log(`receive PackType : ${msg[97]}`);
        })
        server.on('listening', async function () {
            console.log(`listen at ${config.source.udpport}`);
            resolve(server);
        })
        server.bind(config.source.udpport, config.source.ip);
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
 * 这个socket大家一起用
 */
let socket;
async function main() {
    socket = await initSocket(Config);
    await pingTarget();
}
async function pingTarget(){
    let target = getTarget();
    let privateKey = require(`${__dirname}/../models/Utils`).getPk();
    let source = Config.source;

    try{
        let ping = new Ping({
            source: source,
            target: target,
            socket: socket,
            privateKey: privateKey
        })
        await ping.send();
    }catch(e){
        console.log(e)
    }
}

/**
 * ping了目标响应之后，调用pong
 */
async function pongTarget(){

}

main();
