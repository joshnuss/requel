import * as pg from 'pgsql-parser'

import { Schema } from './schema'

export interface SelectStatement {
  type: 'select'
}

export interface InsertStatement {
  type: 'insert'
}

export type Statement = SelectStatement | InsertStatement

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
    const statements = pg.parse(sql)

    statements.forEach((statement) => {
      const { stmt } = statement.RawStmt

      if (stmt.SelectStmt) {
        stmt.SelectStmt.fromClause.find((from) => {
          const relname = from.RangeVar.relname

          this.#requireRelation(relname)
        })
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
    })
  }

  #requireRelation(relation: string) {
    if (!this.schema[relation]) {
      throw new UnknownRelationError(relation)
    }
  }
}
