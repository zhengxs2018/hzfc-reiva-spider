import cheerio from 'cheerio'
import { Job, RequestUtil, SimpleResponse } from 'ppspider'
import { CoreOptions, UriOptions, UrlOptions } from 'request'

export interface TaskInfo extends Partial<Pick<Job, 'key' | 'tryNum'>> {
  url: string
  datas?: Record<string, unknown>
}

export type Task = string | TaskInfo

export abstract class Spider {
  abstract start(...args: unknown[]): Promise<unknown>

  request(
    options: (UriOptions | UrlOptions) &
      CoreOptions & {
        headerLines?: string
      },
    handler?: (error: Error, res: SimpleResponse) => void
  ): Promise<SimpleResponse> {
    const defaultsOptions = {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
      },
    }
    return RequestUtil.simple({ ...defaultsOptions, ...options }, handler)
  }

  async parse(response: SimpleResponse): Promise<cheerio.Root> {
    return cheerio.load(response.body)
  }
}
