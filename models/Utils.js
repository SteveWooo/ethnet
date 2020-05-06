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
exports.ipaddress = function(ip) {
    let buf = Buffer.alloc(4);
    ip = ip.split('.');
    for (var i = 0; i < ip.length; i++) {
        buf[i] = parseInt(ip[i]);

    }
    return buf;
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