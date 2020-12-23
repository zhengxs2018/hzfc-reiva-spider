import { set, toSafeInteger } from 'lodash'

export interface ItemData {
  // pass
}

export interface ListData<T = Record<string, unknown>> {
  items: T[]
  pageCount: number
}

export type SetValue = (
  $el: cheerio.Cheerio,
  ctx: { name: string; item: ItemData }
) => void

export function getText($el: cheerio.Cheerio) {
  return $el.text().trim().replace(/\s/g, '')
}

export const setStringValue: SetValue = ($el, ctx) => {
  set(ctx.item, ctx.name, getText($el.next()))
}

export const setIntValue: SetValue = ($el, ctx) => {
  set(ctx.item, ctx.name, toSafeInteger(getText($el.next())))
}
