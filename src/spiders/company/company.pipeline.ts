import { logger } from 'ppspider'

import { Pipeline } from '../../system/core/pipeline'

import { CompanyItem } from './company.item'
import type { Company } from './company.interface'

export class CompanyPipeline extends Pipeline<Company> {
  __name__ = 'company'

  async processItem(item: CompanyItem) {
    if (item.id === null) {
      console.log(item)
      return
    }

    await item.validate()

    const resp = await this.updateOne(
      { code: item.code },
      { $set: item.toJSON() },
      { upsert: true }
    )
    if (resp.result.ok) {
      logger.debug('从企业档案采集成功......ok')
    } else {
      logger.error('从企业档案采集失败......failed')
    }
  }
}
