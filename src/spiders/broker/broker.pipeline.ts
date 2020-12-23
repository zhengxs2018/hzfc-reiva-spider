import { logger } from 'ppspider'

import { Pipeline } from '../../system/core/pipeline'

import { BrokerItem } from './broker.item'
import type { Broker } from './broker.interface'

export class BrokerPipeline extends Pipeline<Broker> {
  __name__ = 'broker'

  async processItem(item: BrokerItem) {
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
