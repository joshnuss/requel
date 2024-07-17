export interface Field {
  type: 'string' | 'number' | 'boolean' | 'any'
  nullable?: boolean
  array?: boolean
}

export type FieldRecord = Record<string, Field>
export type Schema = Record<string, FieldRecord>
