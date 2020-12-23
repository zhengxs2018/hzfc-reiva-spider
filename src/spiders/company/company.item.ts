import { IsString, IsBoolean, IsInt } from 'class-validator'
import { Expose, plainToClass } from 'class-transformer'

import { Item } from '../../system/core/item'

import type { Company } from './company.interface'

export class CompanyItem extends Item<Company> implements Company {
  @Expose()
  @IsString()
  id!: string

  @Expose()
  @IsString()
  code!: string

  @Expose()
  @IsString()
  name!: string

  @Expose()
  @IsString()
  licenseNo!: string

  @Expose()
  @IsString()
  businessScope!: string

  @Expose()
  @IsString()
  registeredCapital!: string

  @Expose()
  @IsString()
  legalRepresentative!: string

  @Expose()
  @IsString()
  tel!: string

  @Expose()
  @IsString()
  address!: string

  @Expose()
  @IsInt()
  staffTotal!: number

  @Expose()
  @IsBoolean()
  isSFA: boolean = false

  @Expose()
  @IsBoolean()
  isAM: boolean = false

  @Expose()
  @IsString()
  status!: string

  static create(data: Company) {
    return plainToClass(CompanyItem, data, { strategy: 'excludeAll' })
  }
}
