const keccak256 = require('keccak256'); // 哈希用
const rlp = require('rlp');
const Config = {
    version : 0x03,
    packType : 1 // 1代表ping包，pong是2
}

/**
 * 构造一个ping对象，主要是构造一个ping包，包主要是数组嵌套，用rlp编码。其中附带发送函数。
 * ping包的结构是：packHash(包括签名)(32位) | sign(64位) | signRcid（1位） | packType（1位） | packSource（rlp）
 * 其中packHash：keccak256(sign | signRcid | packType | packSource)，出来32位hash
 * 其中sign：ecdsaSign ( keccak256( packType | packSource ) )，出来64位密钥+1位rcid
 * 其中packSource：rlp ( version | endpointFrom | endpointTo | time（秒级整型即可） )
 * 其中endPointFrom和To是数组：ip（转成4字节Buffer） | udpport | tcpport
 * @param target : ip udpport tcpport
 * @param source : ip udpport tcpport
 * @param privateKey 密钥
 * @param socket udpsocket，发送和接收必须用同一个
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
    let sign = require(`${__dirname}/Utils`).getSignBuffer(param.privateKey, pack);
    pack = Buffer.concat([
        sign.signBuffer,
        sign.rcidBuffer,
        pack
    ])
    console.log(`signBufferLength : ${sign.signBuffer.length}`);
    console.log(`rcidBufferBufferLength : ${sign.rcidBuffer.length}`);

    // 最后拼上hash
    let packHash = keccak256(pack);
    pack = Buffer.concat([
        packHash,
        pack
    ])
    console.log(`packHashLength : ${packHash.length}`);

    /**
     * 发送ping包的handle
     */
    this.send = async function(){
        console.log('sending..');
        // let sendFile = [];
        // for(var i=0;i<pack.length;i++) {
        //     let temp = `${i}位: ${pack[i]} - ${String.fromCharCode(pack[i])}`;
        //     sendFile.push(temp);
        //     console.log(temp)
        // }
        // console.log(param)
        param.socket.send(pack, param.target.udpport, param.target.ip, function(){
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
    let sourceIp = require(`${__dirname}/Utils`).ipaddress(source.ip);
    let targetIp = require(`${__dirname}/Utils`).ipaddress(target.ip);

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
    time = Math.floor(time / 1000) + 60;

    let packSource = [
        Config.version,
        from,
        to,
        time
    ]

    let encodePack = rlp.encode(packSource);
    return encodePack;
}
