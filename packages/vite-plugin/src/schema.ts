export interface Field {
  name: string
  type: 'string' | 'number' | 'boolean'
  nullable?: boolean
  array?: boolean
}

export type Schema =
  Record<string, Field[]>
