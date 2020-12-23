import { appInfo, Filter, Job } from 'ppspider'

export class HistoryFilter implements Filter {
  async isExisted(job: Job): Promise<boolean> {
    return HistoryFilter.isExisted(job.key || job.url)
  }

  async setExisted(job: Job): Promise<void> {
    await appInfo.db.save('history', { _id: job.key || job.url })
  }

  async clear(): Promise<void> {
    await HistoryFilter.clear()
  }

  static async isExisted(id: string): Promise<boolean> {
    const record = await appInfo.db.findById('history', id)
    return record !== null
  }

  static async clear(): Promise<void> {
    await appInfo.db.remove('history', {})
  }
}
