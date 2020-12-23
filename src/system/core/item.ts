import { ValidatorOptions, validate } from 'class-validator'
import { plainToClass, classToPlain } from 'class-transformer'

export type ClassType = Parameters<typeof plainToClass>[0]

export abstract class Item<T> {
  validate(options?: ValidatorOptions) {
    return validate(this, options)
  }

  toJSON(): T {
    return classToPlain(this, { strategy: 'exposeAll' }) as T
  }
}
