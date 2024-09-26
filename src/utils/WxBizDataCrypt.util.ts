import * as crypto from 'crypto'

class WxBizDataCrypt {
  appId: null
  sessionKey: null
  decoded: null
  constructor(appId, sessionKey) {
    this.appId = appId
    this.sessionKey = sessionKey
  }

  decryptData(encryptedData, iv) {
    //转换为base64格式数据
    iv = Buffer.from(iv, 'base64')
    encryptedData = Buffer.from(encryptedData, 'base64')
    const newSessionKey = Buffer.from(this.sessionKey, 'base64')

    try {
      //根据给定的算法，密钥和初始化向量，创建并返回一个Decipher解密对象。
      const decipher = crypto.createDecipheriv('aes-128-cbc', newSessionKey, iv)
      //删除填充补位
      decipher.setAutoPadding(true)
      //往decipher实例中添加数据，第一个参数是数据，第二个参数是传入数据的格式，默认是 ‘binary’。第三个参数是返回的数据格式。
      let _decoded = decipher.update(encryptedData, 'binary', 'utf8')
      //返回任何剩余的解密内容。不能调用多次
      _decoded += decipher.final('utf8')
      this.decoded = JSON.parse(_decoded)
    } catch (e) {
      throw new Error('Illegal Buffer')
    }

    //检验是否获取正确，是当前appid的数据
    if ((this.decoded as any).watermark.appid !== this.appId) {
      throw new Error('Illegal Buffer')
    }

    return this.decoded
  }
}

export { WxBizDataCrypt }
