import cheerio from 'cheerio'

import { select, SelectedValue as NodeList } from 'xpath'
import { DOMParser } from 'xmldom'

export { NodeList }

export function parseHTML(text: string) {
  return new DOMParser().parseFromString(text)
}

export function xpath<T extends NodeList = NodeList>(
  expression: string,
  node?: Node
): T[] {
  return select(expression, node) as T[]
}

export function css(text: string) {
  return cheerio.load(text)
}
