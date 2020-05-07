const crypto = require('crypto');
const secp256k1 = require('secp256k1'); // 签名用
const keccak256 = require('keccak256'); // 哈希用
exports.getPk = function() {
    let privateKey = crypto.randomBytes(32);
    return privateKey;
}
/**
 * 把一个ip变成4段Buffer
 */
exports.encodeIpaddress = function(ip) {
    let buf = Buffer.alloc(4);
    ip = ip.split('.');
    for (var i = 0; i < ip.length; i++) {
        buf[i] = parseInt(ip[i]);

    }
    return buf;
}
exports.decodeIpaddress = function (buffer) {
    let ip = [];
    for(var i=0;i<buffer.length;i++) {
        ip.push(buffer[i]);
    }
    return ip.join('.');
}

/**
 * 签名Buffer
 */
exports.getSignBuffer = function (privateKey, pack) {
    let publicKey = secp256k1.publicKeyCreate(privateKey);

    // 签名 signature, recid
    let sign = secp256k1.ecdsaSign(keccak256(pack), privateKey);
    let signBuffer = Buffer.from(sign.signature);
    let rcidBuffer = Buffer.from(String.fromCharCode(sign.recid));

    return {
        signBuffer: signBuffer,
        rcidBuffer: rcidBuffer
    }
}

/**
 * 把整个数据包拿出来读，一个一个字节看
 */
exports.readMsg = function(msg) {
    let data = [];
    for(var i=0;i<msg.length;i++) {
        let temp = `${i}位: ${msg[i]} - ${String.fromCharCode(msg[i])}`;
        console.log(temp);
        data.push(temp);
    }
    // require('fs').writeFileSync(`${__dirname}/../PongDemo`, data.join('\n'));
}