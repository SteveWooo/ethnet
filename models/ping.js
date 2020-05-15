const ethUtils = require('ethereumjs-util');
const keccak256 = ethUtils.keccak256; // 哈希用
const rlp = require('rlp');
const Utils = require(`${__dirname}/Utils`);
const Config = {
    version : 0x04,
    packType : 1 // 1代表ping包，pong是2
}

/**
 * 构造一个ping对象，主要是构造一个ping包，包主要是数组嵌套，用rlp编码。其中附带发送函数。
 * ping包的结构是：
 * packHash(包括签名)(32位) | sign(64位) | signRcid（1位） | packType（1位） | packSource（rlp）
 * 其中packHash：keccak256(sign | signRcid | packType | packSource)，出来32位hash
 * 其中sign：ecdsaSign ( keccak256( packType | packSource ) )，出来64位密钥+1位rcid
 * 其中packSource：rlp ( version | endpointFrom | endpointTo | time（秒级整型即可） )
 * 其中endPointFrom和To是数组：ip（转成4字节Buffer） | udpport | tcpport
 * @param target : ip udpport tcpport
 * @param source : ip udpport tcpport
 * @param privateKey 密钥
 * @param udpSocket udpsocket，发送和接收必须用同一个
 * 
 * @return Ping 一个可用的Ping对象，其中有一个send方法。
 */
module.exports = Ping;
function Ping(param){
    let that = this;

    // 拼原始pack，然后拼type: packType + pack
    let pack = buildPackSourceBuffer(param.source, param.target);
    pack = Buffer.concat([
        Buffer.from(String.fromCharCode(Config.packType)),
        pack
    ])
    // 拿签名，然后拼接sign + signRcid + pack
    let sign = Utils.getSignBuffer(param.privateKey, pack);
    pack = Buffer.concat([
        sign.signBuffer,
        sign.rcidBuffer,
        pack
    ])
    // console.log(`signBufferLength : ${sign.signBuffer.length}`);
    // console.log(`rcidBufferBufferLength : ${sign.rcidBuffer.length}`);

    // 最后拼上hash
    let packHash = keccak256(pack);
    pack = Buffer.concat([
        packHash,
        pack
    ])
    // console.log(`packHashLength : ${packHash.length}`);

    /**
     * 发送ping包的handle
     */
    this.send = async function(){
        console.log('sending.. ping');
        // let sendFile = [];
        // for(var i=0;i<pack.length;i++) {
        //     let temp = `${i}位: ${pack[i]} - ${String.fromCharCode(pack[i])}`;
        //     sendFile.push(temp);
        //     console.log(temp)
        // }
        // console.log(param)
        param.udpSocket.send(pack, param.target.udpport, param.target.ip, function(){
            console.log(`sent`);
        })
    }

    /**
     * 拿数据包出来，让外面自己发个够
     */
    this.getPack = function(){
        return pack;
    }

    return this;
}

/**
 * @param 两个endpoint ip(String), udpport, tcpport
 */
function buildPackSourceBuffer(source, target) {
    /**
     * 构造IP
     */
    let sourceIp = require(`${__dirname}/Utils`).encodeIpaddress(source.ip);
    let targetIp = require(`${__dirname}/Utils`).encodeIpaddress(target.ip);

    let from = [
        sourceIp,
        source.udpport,
        source.tcpport
    ]

    let to = [
        targetIp,
        target.udpport,
        target.tcpport
    ]

    // 转换成秒级，再加60秒时间给他到达目标
    let time = +new Date();
    time = Math.floor(time / 1000) + 1;

    let packSource = [
        Config.version,
        from,
        to,
        time
    ]

    let encodePack = rlp.encode(packSource);
    return encodePack;
}

/**
 * Ping包解码（先不可逆了，有个NaN在不知怎么处理好）
 */
Ping.prototype.decode = function(msg) {
    let payload = msg.slice(98);
    payload = rlp.decode(payload);

    // from（发送ping包的端）
    payload[1][1] = parseInt(payload[1][1].toString('hex'), 16);
    payload[1][2] = parseInt(payload[1][2].toString('hex'), 16);
    payload[1][0] = Utils.decodeIpaddress(payload[1][0]);

    // to 
    payload[2][1] = parseInt(payload[2][1].toString('hex'), 16);
    payload[2][2] = parseInt(payload[2][2].toString('hex'), 16);
    payload[2][0] = Utils.decodeIpaddress(payload[2][0]);

    // 时间戳
    payload[3] = parseInt(payload[3].toString('hex'), 16);

    let header = msg.slice(0, 98);

    let ping = [
        header.slice(0, 32), // hash
        header.slice(32, 96), // sign
        header.slice(97, 98), // rcid
        header.slice(98, 99), // package type
        ...payload
    ]

    return ping;
}