import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import * as bcrypt from 'bcryptjs'
import { IsNotEmpty } from 'class-validator'

@Entity()
export class User {
  /**
   * 检测密码是否一致
   * @param password0 加密前密码
   * @param password1 加密后密码
   */
  static async comparePassword(password0, password1) {
    return bcrypt.compareSync(password0, password1)
  }

  static encryptPassword(password) {
    return bcrypt.hashSync(password, 10)
  }

  @PrimaryGeneratedColumn('uuid')
  id: number

  @ApiProperty()
  @Column({ name: 'name', default: null, length: 500, comment: '名称' })
  name: string

  @ApiProperty()
  @Exclude()
  @Column({ name: 'password', default: null, length: 500, comment: '密码' })
  password: string

  @ApiProperty()
  @Column({ name: 'avatar', default: null, length: 500, comment: '头像' })
  avatar: string

  @ApiProperty()
  @Column({ name: 'email', default: null, length: 500, comment: '邮箱' })
  email: string

  @ApiProperty()
  @Column('simple-enum', { enum: ['admin', 'visitor'], default: 'visitor' })
  role: string // 用户角色

  @ApiProperty()
  @Column('simple-enum', { enum: ['locked', 'active'], default: 'active' })
  status: string // 用户状态

  @ApiProperty()
  @Column({ name: 'is_wx', default: 0, comment: '是否是微信用户' })
  isWx: number

  @ApiProperty()
  @Column({ name: 'code', default: null, comment: '小程序用户code' })
  code: string

  @ApiProperty()
  @Column({ name: 'openid', default: null, comment: '小程序用户openid' })
  openid: string

  @ApiProperty()
  @Column({ name: 'appid', default: null, comment: '小程序用户appid' })
  appid: string

  @ApiProperty()
  @Column({ name: 'token', default: null, comment: '小程序用户token' })
  token: string

  @ApiProperty()
  @Column({ name: 'nick_name', default: null, comment: '小程序用户nickname' })
  nickname: string

  @ApiProperty()
  @Column({ name: 'gender', default: null, comment: '小程序用户gender' })
  gender: number

  @ApiProperty()
  @CreateDateColumn({
    type: 'datetime',
    comment: '创建时间',
    name: 'create_at',
  })
  createAt: Date

  @ApiProperty()
  @UpdateDateColumn({
    type: 'datetime',
    comment: '更新时间',
    name: 'update_at',
  })
  updateAt: Date

  /**
   * 插入数据前，对密码进行加密
   */
  @BeforeInsert()
  encrypt() {
    this.password = bcrypt.hashSync(this.password, 10)
  }
}

export class UserDTO {
  @ApiProperty({
    description: '用户名',
  })
  name: string
  @ApiProperty({
    description: '密码',
  })
  password: string
}

export class WxLoginDTO {
  readonly iv: string
  readonly encryptedData: string
  @IsNotEmpty({ message: 'code不能为空' })
  readonly code: string
}

export interface WxInfo {
  nickName: string
  gender: number
  language: string
  city: string
  province: string
  country: string
  avatarUrl: string
  watermark: { timestamp: number; appid: string }
  is_demote: boolean
}
