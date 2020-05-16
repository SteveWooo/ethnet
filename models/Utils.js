const crypto = require('crypto');
const secp256k1 = require('secp256k1'); // 签名用
const ethUtils = require('ethereumjs-util');
const keccak256 = ethUtils.keccak256; // 哈希用
const elliptic = require('elliptic');
exports.genPrivateKey = function() {
    let privateKey = crypto.randomBytes(32).toString('hex');
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

/**
 * 根据以太坊的规则，利用密钥生成NodeId
 */
exports.getNodeId = function(privateKey) {
    let publicKey = secp256k1.publicKeyCreate(privateKey, false);
    let nodeId = '';
    for(var i=1;i<publicKey.length;i++) {
        let str = publicKey[i].toString(16);
        if(str.length == 1) {
            str = '0' + str
        }
        nodeId += str;
    }
    return nodeId;
}

/**
 * 计算两个NodeId的hash距离
 * 传入的nodeId是一个128位的字符串，它本身是一个16进制字符串，要先转换成16进制Buffer，Buffer.from(nodeId, 'hex)，它会变成64位buffer
 * 由于以太坊只有256个K桶，所以它只会对照前32位
 * 32位 * 8bit/位 = 256 bit，所以nodeid进行距离比较之前，要先slice(0, 32)
 * 这32位Buffer中每一位都能转换成8bit二进制，用这个二进制对比距离。
 * 所以最大的距离是Math.pow(2, 256)-1
 */
exports.calculateDistance = function(nodeIdfrom, nodeIdTo) {
    nodeIdfrom = Buffer.from(nodeIdfrom, 'hex').slice(0, 32);
    nodeIdTo = Buffer.from(nodeIdTo, 'hex').slice(0, 32);
    let totalXOR = [];
    for(var i=0;i<nodeIdfrom.length;i++) {
        let dis = nodeIdfrom[i] ^ nodeIdTo[i];
        dis = dis.toString(2);
        while(dis.length<8) {
            dis = '0' + dis;
        }
        totalXOR.push(dis);
    }
    totalXOR = parseInt(totalXOR.join(''), 2);
    return totalXOR;
}

const LZCOUNT = [
    8, 7, 6, 6, 5, 5, 5, 5,
	4, 4, 4, 4, 4, 4, 4, 4,
	3, 3, 3, 3, 3, 3, 3, 3,
	3, 3, 3, 3, 3, 3, 3, 3,
	2, 2, 2, 2, 2, 2, 2, 2,
	2, 2, 2, 2, 2, 2, 2, 2,
	2, 2, 2, 2, 2, 2, 2, 2,
	2, 2, 2, 2, 2, 2, 2, 2,
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
]
/**
 * 获取NodeId在targetId的桶。虽然谁是target都一样。
 */
exports.getLogicBucket = function(targetId, nodeId) {
    nodeId = ethUtils.keccak256(Buffer.from(nodeId, 'hex')).toString('hex');
    targetId = ethUtils.keccak256(Buffer.from(targetId, 'hex')).toString('hex');
    nodeId = Buffer.from(nodeId, 'hex');
    targetId = Buffer.from(targetId, 'hex');

    let lz = 0;
    for(var i=0;i<nodeId.length;i++) {
        let dis = nodeId[i] ^ targetId[i];
        if(dis == 0) {
            lz += 8
        } else {
            lz += LZCOUNT[dis];
            break
        }

    }
    return nodeId.length * 8 - lz;
}