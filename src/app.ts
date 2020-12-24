import {
  Launcher,
  DbHelperUi,
  PuppeteerWorkerFactory,
  Job,
  RequestMapping,
  AddToQueue,
} from 'ppspider'

import { toSafeInteger } from 'lodash'

import { isString, isNotEmpty } from 'class-validator'
import { Request, Response } from 'express'

import { BROKER_INFO_URI, COMPANY_INFO_URI } from './constants/urls'

import { HistoryFilter } from './filters/history'

import { BrokerSpider } from './spiders/broker/broker.spider'
import { CompanySpider } from './spiders/company/company.spider'

const dataUis = []

const isDev = process.env.NODE_ENV === 'development'

if (isDev) {
  dataUis.push(DbHelperUi)
}

@Launcher({
  workplace: '.workspace',
  dbUrl: process.env.MONGODB_URI,
  tasks: [CompanySpider, BrokerSpider],
  dataUis: dataUis,
  workerFactorys: [
    new PuppeteerWorkerFactory({
      headless: true,
      devtools: true,
    }),
  ],
  logger: {
    level: isDev ? 'debug' : 'info',
  },
  webUiPort: normalizePort(process.env.PORT || '9000')
})
export class AppModule {
  @RequestMapping('/broker/addJob')
  @AddToQueue({ name: 'broker.info.queue', filterType: HistoryFilter })
  async addBrokerJob(req: Request, res: Response) {
    const { code, orgCode } = req.query
    if (
      isString(code) &&
      isNotEmpty(code) &&
      isString(orgCode) &&
      isNotEmpty(orgCode)
    ) {
      const url = new URL(BROKER_INFO_URI)
      url.searchParams.set('cyrybh', code)
      url.searchParams.set('qycode', orgCode)

      const job = new Job(url.toString())

      res.json({ code: 200, message: 'ok', id: job._id })

      return job
    }

    res.json({ code: 400, message: 'Code and  orgCode is required' })
  }

  @RequestMapping('/company/addJob')
  @AddToQueue({ name: 'company.info.queue', filterType: HistoryFilter })
  async addCompanyJob(req: Request, res: Response) {
    const companyId = req.query.id
    if (isString(companyId) && isNotEmpty(companyId)) {
      const url = new URL(COMPANY_INFO_URI)
      url.searchParams.set('qyid', companyId)

      const job = new Job(url.toString())

      res.json({ code: 200, message: 'ok', id: job._id })

      return job
    }

    res.json({ code: 400, message: 'ID is required' })
  }
}

function normalizePort(val: string): number | undefined {
  const port = toSafeInteger(val)
  return port === 0 ? undefined : port
}
