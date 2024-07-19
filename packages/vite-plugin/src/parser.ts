import { ast } from './ast.js'
import type { Options } from './ast.ts'
import { Schema, Field } from './schema.js'
import matter from 'gray-matter'

interface RelationField extends Field {
  name: string
  relation: string
}

interface InputField extends Field {
  name: string
}

export interface Statement {
  type: 'select' | 'insert' | 'upsert' | 'update' | 'delete'
  inputs: InputField[]
  outputs: RelationField[]
}

export class UnknownRelationError extends Error {
  relation: string

  constructor(relation: string) {
    super(`Unknown relation \`${relation}\``)
    this.relation = relation
  }
}

export class UnknownStatementError extends Error {
  constructor() {
    super('Unknown statement')
  }
}

export class Parser {
  schema: Schema
  options: Options

  constructor(schema: Schema, options: Options) {
    this.schema = schema
    this.options = options
  }

  parse(sql: string): Statement {
    let { content, data} = matter(sql)

    const inputs: InputField[] = (content.match(/:(\w+)\b/gm) || []).map((name) => {
      name = name.replace(/^:/, '')

      if (data[name + '?']) name += '?'

      const nullable = name.endsWith('?')
      const type = data[name] || 'any'
      const array = type.endsWith('[]')

      return {
        name: name.replace(/[\?]$/, ''),
        type: type.replace(/\[\]$/, ''),
        array,
        nullable
      }
    })

    const statements = ast(content, this.options)

    for (let statement of statements) {
      const outputs: RelationField[] = []

      statement.relations.forEach((relation) => {
        this.#requireRelation(relation.name)
      })

      statement.fields.forEach((field) => {
        if (field.type == 'wildcard') {
          statement.relations.forEach((relation) => {
            const table = this.schema[relation.name]

            Object.keys(table).forEach((name) => {
              const col = table[name]

              outputs.push({
                name,
                relation: relation.name,
                type: col.type
              })
            })

          })
        } else if (field.type == 'column') {
          const relation = statement.relations[0]
          const table = this.schema[relation.name]
          const col = table[field.name]

          outputs.push({
            name: field.name,
            relation: relation.name,
            type: col.type
          })
        }
      })

      return {
        type: statement.type,
        inputs,
        outputs
      }
    }

    throw new UnknownStatementError()
  }

  #requireRelation(relation: string) {
    if (!this.schema[relation]) {
      throw new UnknownRelationError(relation)
    }
  }
}
