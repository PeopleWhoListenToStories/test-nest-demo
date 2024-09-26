import { HttpException, HttpStatus } from '@nestjs/common'
import { SettingService } from '~/modules/setting/setting.service'
import { OssClient } from '~/utils/oss/oss-client'
import { AliyunOssClient } from '~/utils/oss/aliyun-oss-client'
import { TxyunOssClient } from '~/utils/oss/txyun-oss-client'

export class Oss {
  settingService: SettingService
  config: Record<string, unknown>
  ossClient: OssClient

  constructor(settingService: SettingService) {
    this.settingService = settingService
  }

  private async getConfig() {
    const data = await this.settingService.findAll(true)
    const config = JSON.parse(data.oss) || {}
    if (!config) {
      throw new HttpException('OSS 配置不完善，无法进行操作', HttpStatus.INTERNAL_SERVER_ERROR)
    }
    return config as Record<string, unknown>
  }

  private async getOssClient() {
    const config = await this.getConfig()
    const type = String(config.type).toLowerCase()

    switch (type) {
      case 'aliyun':
        return new AliyunOssClient(config)
      case 'txyun':
        return new TxyunOssClient(config)
      default:
        return new TxyunOssClient(config)
    }
  }

  async putFile(filepath: string, buffer: ReadableStream) {
    const client = await this.getOssClient()
    const url = await client.putFile(filepath, buffer)
    return url
  }

  async deleteFile(url: string) {
    const client = await this.getOssClient()
    await client.deleteFile(url)
  }
}
