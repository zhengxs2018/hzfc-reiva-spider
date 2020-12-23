import { appInfo } from 'ppspider'
import { Collection, FilterQuery, UpdateQuery, UpdateOneOptions } from 'mongodb'

export abstract class Pipeline<TSchema> {
  abstract __name__: string

  async updateOne(
    filter: FilterQuery<TSchema>,
    update: UpdateQuery<TSchema> | Partial<TSchema>,
    options?: UpdateOneOptions
  ) {
    const collection = await this.collection<TSchema>(this.__name__)
    return collection.updateOne(filter, update, options)
  }

  collection<T>(name: string): Promise<Collection<T>> {
    return appInfo.db.collection(name)
  }
}
