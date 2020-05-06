const secp256k1 = require('secp256k1'); // 签名用
const keccak256 = require('keccak256'); // 哈希用
const rlp = require('rlp');

/**
 * 构造一个ping对象，其中有发送函数在里面
 * @param target : ip udpport tcpport
 * @param source : ip udpport tcpport
 * @param privateKey 密钥
 * @param socket udpsocket，发送和接收必须用同一个
 * 
 * @return Ping 一个可用的Ping对象，其中有一个send方法。
 */
function Ping(param){
    let that = this;
    let pack; // 要发送的数据包
    

    /**
     * 发送ping包的handle
     */
    this.send = function(){
        param.socket.send(pack, param.target.udpport, param.target.ip, function(){
            console.log(`sent`);
        })
    }

    return this;
}
