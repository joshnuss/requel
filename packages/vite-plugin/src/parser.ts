import * as pg from 'pgsql-parser'
import { Schema, Field } from './schema'
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

export class Parser {
  schema: Schema

  constructor(schema: Schema) {
    this.schema = schema
  }

  parse(sql: string): Statement {
    let { content, data} = matter(sql)

    const inputs: InputField[] = (content.match(/:(\w+)\b/gm) || []).map((name) => {
      content = content.replaceAll(name, '?')
      name = name.replace(/^:/, '')

      if (data[name + '?']) name += '?'

      const nullable = name.endsWith('?')
      const type = data[name] || 'any'
      const array = type.endsWith('[]')

      return {
        name: name.replace('[?]$', ''),
        type: type.replace(/\[\]$/, ''),
        array,
        nullable
      }
    })

    const statements = pg.parse(content)

    for (let statement of statements) {
      const { stmt } = statement.RawStmt

      if (stmt.SelectStmt) {
        stmt.SelectStmt.fromClause.find((from) => {
          const relname = from.RangeVar.relname

          this.#requireRelation(relname)
        })

        return {
          type: 'select',
          inputs,
          outputs: []
        }
      } else if (stmt.InsertStmt) {
        const relname = stmt.InsertStmt.relation.relname

        this.#requireRelation(relname)
      } else if (stmt.UpdateStmt) {
        const relname = stmt.UpdateStmt.relation.relname

        this.#requireRelation(relname)
      } else if (stmt.DeleteStmt) {
        const relname = stmt.DeleteStmt.relation.relname

        this.#requireRelation(relname)
      }
    }
  }

  #requireRelation(relation: string) {
    if (!this.schema[relation]) {
      throw new UnknownRelationError(relation)
    }
  }
}
