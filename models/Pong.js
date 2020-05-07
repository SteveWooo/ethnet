const keccak256 = require('keccak256'); // 哈希用
const Utils = require(`${__dirname}/Utils`);
const rlp = require('rlp');
const Config = {
    version: 0x03,
    packType: 2 // 1代表ping包，pong是2
}

/**
 * Pong包的结构是
 * packHash(包括签名)(32位) | sign(64位) | signRcid（1位） | packType（1位） | packSource（rlp）
 * 其中packSour结构为
 * endpointTo（发ping包的那个端）| echo（ping包的hash）| time（秒级时间戳）
 * 其中endpointTo结构为
 * ip udpport tcpport
 * 
 * @param ping 发过来的ping包（需要是decode好的）
 * @param privateKey 密钥
 * @param udpSocket udpsocket，发送和接收必须用同一个
 *
 * @return Ping 一个可用的Ping对象，其中有一个send方法。
 */
module.exports = Pong;
function Pong(param) {
    let that = this;

    let target = {
        ip: param.ping[5][0],
        udpport: param.ping[5][1],
        tcpport: param.ping[5][2]
    }
    target = param.target

    // 拼原始pack，然后拼type: packType + pack
    let pack = buildPackSourceBuffer(target, param.ping[0]);
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

    // 最后拼上hash
    let packHash = keccak256(pack);
    pack = Buffer.concat([
        packHash,
        pack
    ])

    /**
     * 发送ping包的handle
     */
    this.send = async function () {
        console.log('sending.. pong');
        console.log('decode pong:');
        console.log(Pong.prototype.decode(pack));
        param.udpSocket.send(pack, target.udpport, target.ip, function () {
            console.log(`sent`);
        })    
    }

    /**
     * 拿数据包出来，让外面自己发个够
     */
    this.getPack = function () {
        return pack;
    }

    return this;
}

/**
 * @param 两个endpoint ip(String), udpport, tcpport
 */
function buildPackSourceBuffer(target, echo) {
    /**
     * 构造IP
     */
    let targetIp = Utils.encodeIpaddress(target.ip);

    let to = [
        targetIp,
        target.udpport,
        target.tcpport
    ]

    // 转换成秒级，再加60秒时间给他到达目标
    let time = +new Date();
    time = Math.floor(time / 1000) + 60;

    let packSource = [
        to,
        echo,
        time
    ]

    let encodePack = rlp.encode(packSource);
    return encodePack;
}

/**
 * Pong包解码（先不可逆了，有个NaN在不知怎么处理好）
 */
Pong.prototype.decode = function (msg) {
    let payload = msg.slice(98);
    payload = rlp.decode(payload);

    // to (接收Pong的端，也就是一开始发送ping的那个端)
    payload[0][1] = parseInt(payload[0][1].toString('hex'), 16);
    payload[0][2] = parseInt(payload[0][2].toString('hex'), 16);
    payload[0][0] = Utils.decodeIpaddress(payload[0][0]);

    // 时间戳
    payload[2] = parseInt(payload[2].toString('hex'), 16);

    let header = msg.slice(0, 98);

    let pong = [
        header.slice(0, 32), // hash
        header.slice(32, 96), // sign
        header.slice(97, 98), // rcid
        header.slice(98, 99), // package type
        ...payload
    ]

    return pong;
}