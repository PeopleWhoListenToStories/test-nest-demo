import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { ApiProperty } from '@nestjs/swagger'

@Entity()
export class Sms {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty()
  @Column()
  fullName: string // 用户名

  @ApiProperty()
  @Column()
  mobile: string // 手机号

  @ApiProperty()
  @Column()
  template: string // 模版条件

  @ApiProperty()
  @Column('simple-enum', { enum: ['locked', 'active'], default: 'active' })
  status: string // 是否禁用

  @ApiProperty()
  @Column('simple-enum', { enum: ['locked', 'active'], default: 'locked' })
  isTodaySend: string // 当天是否发送

  @ApiProperty()
  @Column({
    type: 'datetime',
    comment: '发送短信时间',
    name: 'send_at',
  })
  sendAt: string // 发送短信时间

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
}
