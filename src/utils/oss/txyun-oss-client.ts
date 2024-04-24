import * as TxyunOSS from 'cos-nodejs-sdk-v5'
import { OssClient } from './oss-client'

export class TxyunOssClient extends OssClient {
  private async buildClient() {
    const config = this.config
    return new TxyunOSS({
      SecretId: config.SecretId as string,
      SecretKey: config.SecretKey as string, // 私钥
    })
  }

  async putFile(filepath: string, buffer: any) {
    const client = await this.buildClient()
    const data = await new Promise((resolve) => {
      client.putObject(
        {
          Bucket: this.config.bucket as string, // 'picture-1302857231' /* Bucket,名称 必须 */,
          Region: this.config.region as string, // 'ap-beijing' /* 所属地域 必须 */,
          Key: filepath /* 必须 */,
          Body: buffer, // 上传文件对象
          onProgress(progressData) {
            console.log(JSON.stringify(progressData)) // 返回信息，包括路径
          },
        },
        (err, data: TxyunOSS.PutObjectResult) => {
          resolve(data.Location)
        },
      )
    })
    return `https://${data}`
  }

  async deleteFile(url: string) {
    // const client = await this.buildClient()
    // await client.delete(url)
  }
}
