// 'use strict';
import { HttpException, HttpStatus } from '@nestjs/common'
import { SettingService } from '~/modules/setting/setting.service'
import { errorLogger } from '~/logger'

import QcloudSms from 'qcloudsms_js'

export class CloudSms {
  settingService: SettingService
  config: Record<string, unknown>

  constructor(settingService: SettingService) {
    this.settingService = settingService
  }

  private async getConfig() {
    const data = await this.settingService.findAll(true)
    const config = JSON.parse(data.oss) || {}
    if (!config) {
      throw new HttpException('OSS 配置不完善，无法进行操作', HttpStatus.BAD_REQUEST)
    }
    return config as Record<string, unknown>
  }

  private async getCloudConfig() {
    const config = await this.getConfig()
    const client = QcloudSms(config.appid, config.appkey) // 实例化 QcloudSms
    return client.SmsMultiSender()
  }

  async sendCloudSms(phoneList: string[], codeList: Array<number | string>) {
    const config = await this.getConfig()
    const client = await this.getCloudConfig()
    return new Promise((resolve) => {
      client.sendWithParam(
        86,
        phoneList, // 一个数组
        config.templateId, // 模版 id
        codeList, // 正文中的参数值
        config.smsSign, // 签名 未提供或者为空时，会使用默认签名发送短信
        '',
        '',
        (err, res, resData) => {
          // 回调函数
          if (!err) {
            resolve(resData)
          } else {
            console.log('err: ', err, res, resData)
            errorLogger.info(`${err}${res}${resData}`)
          }
        },
      )
    })
  }
}
