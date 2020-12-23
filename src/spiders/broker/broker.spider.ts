import config from 'config'

import { head, toSafeInteger } from 'lodash'

import {
  OnStart,
  OnStartConfig,
  OnTime,
  OnTimeConfig,
  AddToQueue,
  FromQueue,
  Job,
} from 'ppspider'

import { HistoryFilter } from '../../filters/history'
import { REIVA_BASE_URL, BROKER_LIST_URI } from '../../constants/urls'

import {
  getText,
  setStringValue,
  ListData,
  SetValue,
} from '../../system/common/helpers'
import { Spider, Task } from '../../system/core/spider'

import { Broker } from './broker.interface'
import { BrokerPipeline } from './broker.pipeline'
import { BrokerItem } from './broker.item'

export interface ItemData extends Partial<Broker> {
  name: string
  url: string
}

export class BrokerSpider extends Spider {
  pipeline: BrokerPipeline = new BrokerPipeline()

  fields: Array<[string, keyof ItemData, SetValue]> = [
    ['姓名', 'name', setStringValue],
    ['从业编号', 'code', setStringValue],
    ['性别', 'gender', setStringValue],
    ['联系电话', 'tel', setStringValue],
    // ['星级级数', '', setStringValue],

    ['从业机构', 'orgName', setStringValue],
    // ['从业年限', '', setStringValue],

    // ['满意率', '', setStringValue],
    // ['交易数', '', setStringValue],
    // ['评价率', '', setStringValue],
    // ['评价数', '', setStringValue],
    // ['处罚情况', '', setStringValue],
    // ['投诉情况', '', setStringValue]
  ]

  @OnStart({
    ...config.get<OnStartConfig>('tasks.broker'),
    running: false,
    urls: [BROKER_LIST_URI],
    defaultDatas: { force: true },
  })
  @OnTime({
    ...config.get<OnStartConfig>('tasks.broker'),
    ...config.get<OnTimeConfig>('scheduler.broker'),
    urls: [BROKER_LIST_URI],
  })
  @AddToQueue([
    { name: 'broker.list.queue' },
    { name: 'broker.info.queue', filterType: HistoryFilter },
  ])
  async start(job: Job) {
    const $ = await this.parse(await this.request({ url: job.url }))

    const { items, pageCount } = this.processList($)
    if (items.length === 0) return []

    // 简单判断下是否存在新数据
    if (job.datas.force !== true) {
      const firstItem = head(items) as ItemData
      if (await HistoryFilter.isExisted(firstItem.url)) {
        return []
      }
    }

    const url = new URL(job.url)
    const searchParams = url.searchParams
    const tasks: Task[] = []

    for (let i = 1; i < pageCount; i++) {
      searchParams.set('page', (i + 1).toString())
      tasks.push({ url: url.toString() })
    }

    return {
      'broker.list.queue': tasks,
      'broker.info.queue': this.toTasks(items),
    }
  }

  @FromQueue({ name: 'broker.list.queue', parallel: 50, exeInterval: 800 })
  @AddToQueue({ name: 'broker.info.queue', filterType: HistoryFilter })
  async handleListTask(job: Job): Promise<Task[]> {
    const $ = await this.parse(await this.request({ url: job.url }))

    const { items } = this.processList($)
    if (items.length === 0) return []

    return this.toTasks(items)
  }

  @FromQueue({ name: 'broker.info.queue', parallel: 150, exeInterval: 1500 })
  async handleInfoTask(job: Job): Promise<void> {
    const $ = await this.parse(await this.request({ url: job.url }))

    const fields = this.fields
    const item: BrokerItem = BrokerItem.create(job.datas.item || {})
    const $el = $('.query-mian-right .padding-horizontal25')

    // 签约状态
    item.status = getText($el.find('.tm-check-sign'))

    $el.find('.lhg50 .color-666').each((_, elm) => {
      const $el = $(elm)
      const label = getText($el)

      fields.find(([searchString, name, setFieldValue]) => {
        if (label.indexOf(searchString) === -1) return false
        setFieldValue($el, { name, item })
        return true
      })
    })

    await this.pipeline.processItem(item)
  }

  processList($: cheerio.Root): ListData<ItemData> {
    const items: ItemData[] = []

    const pageCount = toSafeInteger(getText($('.nlc_totalpage').find('font')))
    if (pageCount === 0) return { pageCount: 0, items }

    const $table = $('.query-mian-right-table')
    $table.find('tr').each((_, elm) => {
      const $tr = $(elm)

      // 跳过表头
      if ($tr.find('th').length > 0) return

      // 处理列表项数据
      const item = this.processItem($, $tr)
      if (item.url) {
        items.push(item)
      }
    })

    return { items, pageCount }
  }

  processItem($: cheerio.Root, $el: cheerio.Cheerio): ItemData {
    const data: ItemData = {
      code: getText($el.find('td:nth-child(1)')),
      name: getText($el.find('td:nth-child(2)')),
      orgName: getText($el.find('td:nth-child(3)')),
      url: '',
    }

    // 处理表格链接
    $el.find('td:nth-child(4) a').each((_, elm) => {
      const $link = $(elm)
      const href = $link.attr('href') || ''
      const url = new URL(href, REIVA_BASE_URL)
      const searchParams = url.searchParams

      switch (getText($link)) {
        case '基本信息':
          data.url = url.toString()
          data.orgCode = searchParams.get('qycode') as string
          break
      }
    })

    return data
  }

  toTasks(items: ItemData[]): Task[] {
    return items.map((item) => ({
      url: item.url,
      datas: { item },
    }))
  }
}
