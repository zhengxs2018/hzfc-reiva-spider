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

import { REIVA_BASE_URL, COMPANY_LIST_URI } from '../../constants/urls'

import { HistoryFilter } from '../../filters/history'

import {
  getText,
  setStringValue,
  setIntValue,
  ListData,
  SetValue,
} from '../../system/common/helpers'
import { Spider, Task } from '../../system/core/spider'

import { Company } from './company.interface'
import { CompanyPipeline } from './company.pipeline'
import { CompanyItem } from './company.item'

export interface ItemData extends Partial<Company> {
  name: string
  url: string
}

export class CompanySpider extends Spider {
  pipeline: CompanyPipeline = new CompanyPipeline()

  fields: Array<[string, keyof ItemData, SetValue]> = [
    ['机构名称', 'name', setStringValue],
    ['固定经营场所', 'address', setStringValue],
    ['营业执照号', 'licenseNo', setStringValue],
    ['注册资金', 'registeredCapital', setStringValue],
    ['法人代表', 'legalRepresentative', setStringValue],
    ['员工总人数', 'staffTotal', setIntValue],
    // ['已备案房地产经纪执业人员数量', '', this.setIntValue],
    ['联系电话', 'tel', setStringValue],
    ['联系电话', 'tel', setStringValue],
    ['经营范围', 'businessScope', setStringValue],
    // ['兼营信息', '', setStringValue],
    // ['交易数', '', setStringValue],
    // ['评价率', '', setStringValue],
    // ['评价数', '', setStringValue],
    // ['处罚情况', '', setStringValue],
    // ['投诉情况', '', setStringValue]
  ]

  /**
   * 爬虫入口
   *
   * @todo 需要判断是否有数据更新
   */
  @OnStart({
    ...config.get<OnStartConfig>('tasks.company'),
    running: false,
    urls: [COMPANY_LIST_URI],
    defaultDatas: { force: true },
  })
  @OnTime({
    ...config.get<OnStartConfig>('tasks.company'),
    ...config.get<OnTimeConfig>('scheduler.company'),
    urls: [COMPANY_LIST_URI],
  })
  @AddToQueue([
    { name: 'company.list.queue' },
    { name: 'company.info.queue', filterType: HistoryFilter },
  ])
  async start(job: Job) {
    const $ = await this.parse(
      await this.request({
        url: job.url,
      })
    )

    const { items, pageCount } = this.processList($)
    if (items.length === 0) return {}

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
      'company.list.queue': tasks,
      'company.info.queue': this.toTasks(items),
    }
  }

  @FromQueue({ name: 'company.list.queue', parallel: 50, exeInterval: 800 })
  @AddToQueue({ name: 'company.info.queue', filterType: HistoryFilter })
  async handleListTask(job: Job): Promise<Task[]> {
    const $ = await this.parse(await this.request({ url: job.url }))

    const res = this.processList($)
    if (res === null) return []

    return this.toTasks(res.items)
  }

  @FromQueue({ name: 'company.info.queue', parallel: 150, exeInterval: 1500 })
  async handleInfoTask(job: Job): Promise<void> {
    const $ = await this.parse(await this.request({ url: job.url }))

    const fields = this.fields
    const item: CompanyItem = CompanyItem.create(job.datas.item || {})
    const $el = $('.query-mian-right .padding-horizontal25')

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
    if (pageCount === 0) return { pageCount, items }

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
      name: getText($el.find('td:nth-child(1)')),
      isSFA: false,
      isAM: false,
      url: '',
    }

    // 处理表格链接
    $el.find('td:nth-child(2) a').each((_, elm) => {
      const $link = $(elm)
      const href = $link.attr('href') || ''
      const url = new URL(href, REIVA_BASE_URL)
      const searchParams = url.searchParams

      switch (getText($link)) {
        case '基本信息':
          data.id = searchParams.get('qyid') as string
          data.url = url.toString()
          break
        case '从业人员':
          data.code = searchParams.get('qycode') as string
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
