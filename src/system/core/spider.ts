import cheerio from 'cheerio'
import { Job, RequestUtil, SimpleResponse } from 'ppspider'
import { CoreOptions, UriOptions, UrlOptions } from "request";

export interface TaskInfo
  extends Partial<Pick<Job, 'queue' | 'key' | 'tryNum'>> {
  name?: string
  url: string
  datas?: Record<string, unknown>
}

export type Task = string | TaskInfo


export abstract class Spider {
  abstract start(...args: unknown[]): Promise<Task[]>

  request(options: (UriOptions | UrlOptions) & CoreOptions & {
    headerLines?: string;
  }, handler?: ((error: Error, res: SimpleResponse) => void)): Promise<SimpleResponse> {
    return RequestUtil.simple(options, handler)
  }

  async parse(response: SimpleResponse): Promise<cheerio.Root> {
    return cheerio.load(response.body)
  }
}
