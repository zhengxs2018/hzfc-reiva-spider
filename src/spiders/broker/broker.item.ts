import { IsString } from 'class-validator'
import { Expose, plainToClass } from 'class-transformer'

import { Item } from '../../system/core/item'

import type { Broker } from './broker.interface'

export class BrokerItem extends Item<Broker> implements Broker {
  @Expose()
  @IsString()
  code!: string

  @Expose()
  @IsString()
  name!: string

  @Expose()
  @IsString()
  gender!: string

  @Expose()
  @IsString()
  tel!: string

  @Expose()
  @IsString()
  orgCode!: string

  @Expose()
  @IsString()
  orgName!: string

  @Expose()
  @IsString()
  status!: string

  static create(data: Broker) {
    return plainToClass(BrokerItem, data, { strategy: 'excludeAll' })
  }
}
