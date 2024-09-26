import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { getConnection, In, Repository } from 'typeorm'
import { Cron, Interval, Timeout } from '@nestjs/schedule'
import { dateFormat, dayFormat } from '~/utils/date.util'
import { isMobile } from '~/utils/validate.util'
import { CloudSms } from '~/utils/cloudsms.utils'
import { infoLogger } from '~/logger/index'
import { Sms } from '~/modules/sms/sms.entity'
import { SettingService } from '~/modules/setting/setting.service'

const dateList = [
  {
    id: 0,
    name: '凌晨',
    min: 0,
    max: 2,
  },
  {
    id: 1,
    name: '黎明',
    min: 2,
    max: 5,
  },
  {
    id: 3,
    name: '拂晓',
    min: 5,
    max: 6,
  },
  {
    id: 4,
    name: '清晨',
    min: 6,
    max: 7,
  },
  {
    id: 5,
    name: '早晨',
    min: 7,
    max: 8,
  },
  {
    id: 6,
    name: '上午',
    min: 8,
    max: 11,
  },
  {
    id: 7,
    name: '中午',
    min: 11,
    max: 13,
  },
  {
    id: 8,
    name: '下午',
    min: 13,
    max: 16,
  },
  {
    id: 9,
    name: '黄昏',
    min: 16,
    max: 17,
  },
  {
    id: 10,
    name: '傍晚',
    min: 17,
    max: 18,
  },
  {
    id: 11,
    name: '晚上',
    min: 18,
    max: 22,
  },
  {
    id: 12,
    name: '夜间',
    min: 22,
    max: 24,
  },
]

@Injectable()
export class SmsService {
  private cloudSms: CloudSms

  private readonly logger = new Logger(SmsService.name)

  constructor(
    @InjectRepository(Sms)
    private readonly repository: Repository<Sms>,
    private readonly settingService: SettingService,
  ) {
    this.cloudSms = new CloudSms(this.settingService)
  }

  /**
   * 新增数据
   */
  async createUserSms(smsData: Partial<Sms> | Array<Partial<Sms>>): Promise<Sms[]> {
    if (!Array.isArray(smsData)) {
      smsData = [smsData]
    }
    // if (smsData.some((knowledge) => !knowledge.parentId)) {
    //   throw new HttpException('无效的知识库章节', HttpStatus.INTERNAL_SERVER_ERROR);
    // }
    const result = []
    for (const knowledge of smsData) {
      result.push(await this.createMobileSmsInfo(knowledge))
    }
    return result
  }

  /**
   * 新建短信手机号列表
   * @param
   */
  async createMobileSmsInfo(smsData: Partial<Sms>): Promise<Sms> {
    const { mobile } = smsData
    if (!isMobile(mobile)) {
      // 手机号考虑
      throw new HttpException('手机号格式不正确', HttpStatus.OK)
    }

    const exist = await this.repository.findOne({ where: { mobile } })
    if (exist && mobile) {
      // 手机号考虑
      throw new HttpException('手机号已存在', HttpStatus.OK)
    }

    // if (status === 'locked') {
    //   Object.assign(smsData, { publishAt: dateFormat() });
    // }

    const data = await this.repository.create(smsData)
    await this.repository.save(data)
    return data
  }

  /**
   * 删除手机号
   */
  async deleteMobile(id) {
    const data = await this.repository.findOne(id)
    if (!data) {
      throw new HttpException('没有对应的数据', HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!data.id) {
      const query = this.repository.createQueryBuilder('sms').where('sms.id=:id').setParameter('id', data.id)
      const children = await query.getMany()
      if (children.length) {
        for (const item of children) {
          await this.repository.remove(item)
        }
      }
    }
    return this.repository.remove(data)
  }

  /**
   * 修改手机号
   */
  async updateMobile(id, data: Partial<Sms>): Promise<Sms> {
    const oldData = await this.repository.findOne(id)
    if (!oldData) {
      throw new HttpException('没有对应的数据', HttpStatus.INTERNAL_SERVER_ERROR)
    }
    const newData = {
      ...data,
    }
    const result = await this.repository.merge(oldData, newData)
    await this.repository.save(result)
    return result
  }

  /**
   * 获取所有手机号列表
   */
  async findAll(queryParams): Promise<[Sms[], number]> {
    const query = this.repository.createQueryBuilder('sms')
    const { page = 1, pageSize = 10, status, ...otherParams } = queryParams
    query.skip((+page - 1) * +pageSize)
    query.take(+pageSize)
    if (status) {
      query.andWhere('sms.status=:status').setParameter('status', status)
    }
    if (otherParams) {
      Object.keys(otherParams).forEach((key) => {
        query.andWhere(`sms.${key} LIKE :${key}`).setParameter(`${key}`, `%${otherParams[key]}%`)
      })
    }
    const [data, total] = await query.getManyAndCount()
    return [data, total]
  }

  /**
   * 定时任务 一分钟执行一次
   */
  @Cron('1 * * * * 1-5')
  async sendEveryDaySmsOnMinute() {
    // this.cloudSms = new CloudSms(this.settingService)
    const status = 'active' // 激活状态的手机号
    const isTodaySend = 'locked' // 当天未发送短信的状态
    const query = this.repository.createQueryBuilder('sms')
    query.andWhere('sms.status=:status').setParameter('status', status)
    query.andWhere('sms.isTodaySend=:isTodaySend').setParameter('isTodaySend', isTodaySend)
    const [data] = await query.getManyAndCount()
    const idList = []
    const hours = new Date().getHours()
    const { name: currentTimeName } = dateList.find((item) => item.max > hours && item.min <= hours)
    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      const time = new Date(item.sendAt)

      const hours = time.getHours()
      const minutes = time.getMinutes()
      console.log(time, hours, minutes, new Date().getHours(), new Date().getMinutes())

      if (hours === new Date().getHours() && minutes === new Date().getMinutes()) {
        const templateList = item.template.split(',') || []
        idList.push(item.id)
        const phoneList = [item.mobile || '']
        const dayInfo = [
          +dateFormat(null, templateList[0] || 'MM'),
          +dateFormat(null, templateList[1] || 'dd'),
          currentTimeName || '-',
          item.fullName,
          `${templateList[2]}`,
          `${templateList[3]}${+dayFormat(templateList[4]) || '-'}`,
          `${templateList[5]}${+dayFormat(templateList[6]) || '-'}`,
          `${templateList[7]}${+dayFormat(templateList[8]) || '-'}`,
        ]

        const [month, day, dayType, fullName, otherText, nationalDay, newYearsDay, springFestival] = dayInfo

        const clouldResult = await this.cloudSms.sendCloudSms(phoneList, dayInfo)
        this.logger.debug(clouldResult)
        // const result = `${dayInfo[0]}月${dayInfo[1]}日 上午好，工作再累，一定不要忘记摸鱼哦！有事没事起身去茶水间，去廊道走走别老在工位上坐着，
        //                 钱是老板的，但命是自己的 距离周末还有${dayInfo[2]}天 距离清明假期还有${dayInfo[3]}天 距离劳动假期还有${dayInfo[4]}天 再过${dayInfo[5]}天就过年啦 愿天下的摸鱼人都能愉快滴渡过每一天~
        //                `;
        if (clouldResult) {
          const result = `【清Feng徐来】提醒您: ${month}月${day}日${dayType}好，${fullName}! 工作再累，一定不要忘记摸鱼哦！有事没事起身去茶水间，去厕所，去廊道走走，别老在工位上坐着～ 人的精力不可能连续集中8小时，在工作间隙听听歌、发发呆、摆摆烂，也无伤大雅。${otherText} Festival Countdown : ${nationalDay}天 ${newYearsDay}天 ${springFestival}天`
          infoLogger.info([phoneList, result])
        }
      }
    }
    if (idList.length) {
      await getConnection()
        .createQueryBuilder()
        .update(Sms)
        .set({ isTodaySend: 'active' })
        .where({ id: In(idList) })
        .execute()
    }
  }

  /**
   * 定时任务 每天0:00 重置sms表的isTodaySend字段为active
   */
  @Cron('0 0 0 * * *')
  async resetSms() {
    const query = this.repository.createQueryBuilder('sms')
    const [data, total] = await query.getManyAndCount()
    await getConnection()
      .createQueryBuilder()
      .update(Sms)
      .set({ isTodaySend: 'locked' })
      .where({ id: In(data.map((v) => v.id)) })
      .execute()
  }

  testAction() {
    console.log('执行了')
  }
}
