import { parse } from 'sql-parser-cst'

interface Field {
  type: 'wildcard' | 'column',
  name: string
  alias: string | null
}

interface Relation {
  name: string
  alias: string | null
}

interface SelectStatement {
  type: 'select',
  fields: Field[],
  relations: Relation[]
}

type Statement = SelectStatement

type Dialect = 'sqlite' | 'bigquery' | 'mysql' | 'mariadb' | 'postgresql'

class UnsupportedCommandError extends Error {
  constructor(type: string, sql: string) {
    super(`Unsupported statement \`${type}\` \`${sql}\``)
  }
}

export const ast = (sql: string, dialect: Dialect) : Statement[] => {
  const cst = parse(sql, { dialect })

  return cst.statements.map((statement): Statement => {
    if (statement.type == 'select_stmt') {
      const select_clause = statement.clauses.find((clause) => clause.type == 'select_clause')
      const from_clause = statement.clauses.find((clause) => clause.type == 'from_clause')

      const relations: Relation[] = []
      const fields: Field[] = []

      function addRelation(name: string, alias?: string) {
        relations.push({
          name,
          alias: alias ?? null
        })
      }

      if (from_clause?.type == 'from_clause') {
        if (from_clause.expr.type == 'identifier') {
          addRelation(from_clause.expr.name)
        } else if (from_clause.expr.type == 'alias' && from_clause.expr.expr.type == 'identifier') {
          addRelation(from_clause.expr.expr.name, from_clause.expr.alias.name)
        } else if (from_clause.expr.type == 'join_expr') {

          if (from_clause.expr.left.type == 'identifier')
            addRelation(from_clause.expr.left.name)
          else if (from_clause.expr.left.type == 'alias' && from_clause.expr.left.expr.type == 'identifier')
            addRelation(from_clause.expr.left.expr.name, from_clause.expr.left.alias.name)

          if (from_clause.expr.right.type == 'identifier')
            addRelation(from_clause.expr.right.name)
          else if (from_clause.expr.right.type == 'alias' && from_clause.expr.right.expr.type == 'identifier')
            addRelation(from_clause.expr.right.expr.name, from_clause.expr.right.alias.name)
        }
      }

      if (select_clause?.type == 'select_clause') {
        select_clause.columns?.items.map((column) => {
          if (column.type == 'all_columns') {
            fields.push({
              type: 'wildcard',
              name: '*',
              alias: null
            })
          } else if (column.type == 'identifier') {
            fields.push({
              type: 'column',
              name: column.name,
              alias: null
            })
          } else if (column.type == 'alias' && column.expr.type == 'identifier') {
            fields.push({
              type: 'column',
              name: column.expr.name,
              alias: column.alias.name
            })
          }
        })
      }

      return {
        type: 'select',
        fields,
        relations
      }
    }

    throw new UnsupportedCommandError(statement.type, sql)
  })
}

