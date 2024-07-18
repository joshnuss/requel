import { parse } from 'sql-parser-cst'
import type { SelectStmt, InsertStmt, UpdateStmt, DeleteStmt } from 'sql-parser-cst'

interface Field {
  type: 'wildcard' | 'column',
  name: string
  alias: string | null
}

interface Relation {
  name: string
  alias: string | null
}

interface Statement {
  type: 'select' | 'insert' | 'update' | 'upsert' | 'delete',
  fields: Field[],
  relations: Relation[]
}

export interface Options {
  dialect: 'sqlite' | 'bigquery' | 'mysql' | 'mariadb' | 'postgresql'
}

class UnsupportedCommandError extends Error {
  constructor(type: string, sql: string) {
    super(`Unsupported statement \`${type}\` \`${sql}\``)
  }
}

export const ast = (sql: string, options: Options) : Statement[] => {
  const cst = parse(sql, {
    paramTypes: [':name'],
    ...options
  })

  return cst.statements.map((statement): Statement => {
    if (statement.type == 'select_stmt') {
      return selectAst(statement)
    } else if (statement.type == 'insert_stmt') {
      return insertAst(statement)
    } else if (statement.type == 'update_stmt') {
      return updateAst(statement)
    } else if (statement.type == 'delete_stmt') {
      return deleteAst(statement)
    }

    throw new UnsupportedCommandError(statement.type, sql)
  })
}

const selectAst = (statement: SelectStmt): Statement => {
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

const deleteAst = (statement: DeleteStmt): Statement => {
  const fields: Field[] = []
  const relations: Relation[] = []

  const delete_clause = statement.clauses.find((clause) => clause.type == 'delete_clause')
  const returning_clause = statement.clauses.find((clause) => clause.type == 'returning_clause')

  if (delete_clause?.type == 'delete_clause') {
    delete_clause.tables.items.forEach((table) => {
      if (table.type == 'identifier') {
        relations.push({
          name: table.name,
          alias: null
        })
      } else if (table.type == 'alias' && table.expr.type == 'identifier') {
        relations.push({
          name: table.expr.name,
          alias: table.alias.name
        })
      }
    })
  }

  if (returning_clause?.type == 'returning_clause' && returning_clause.columns.type == 'list_expr') {
    returning_clause.columns.items.forEach((column) => {
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
    type: 'delete',
    fields,
    relations
  }
}

const insertAst = (statement: InsertStmt): Statement => {
  const fields: Field[] = []
  const relations: Relation[] = []

  const insert_clause = statement.clauses.find((clause) => clause.type == 'insert_clause')
  const returning_clause = statement.clauses.find((clause) => clause.type == 'returning_clause')
  const upsert_clause = statement.clauses.find((clause) => clause.type == 'upsert_clause')

  if (insert_clause?.type == 'insert_clause') {
    const { table } = insert_clause

    if (table.type == 'identifier') {
      relations.push({
        name: table.name,
        alias: null
      })
    } else if (table.type == 'alias' && table.expr.type == 'identifier') {
      relations.push({
        name: table.expr.name,
        alias: table.alias.name
      })
    }
  }

  if (returning_clause?.type == 'returning_clause' && returning_clause.columns.type == 'list_expr') {
    returning_clause.columns.items.forEach((column) => {
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
    type: upsert_clause ? 'upsert' : 'insert',
    fields,
    relations
  }
}

const updateAst = (statement: UpdateStmt): Statement => {
  const fields: Field[] = []
  const relations: Relation[] = []

  const update_clause = statement.clauses.find((clause) => clause.type == 'update_clause')
  const returning_clause = statement.clauses.find((clause) => clause.type == 'returning_clause')

  if (update_clause?.type == 'update_clause') {
    update_clause.tables.items.forEach((table) => {
      if (table.type == 'identifier') {
        relations.push({
          name: table.name,
          alias: null
        })
      } else if (table.type == 'alias' && table.expr.type == 'identifier') {
        relations.push({
          name: table.expr.name,
          alias: table.alias.name
        })
      }
    })
  }

  if (returning_clause?.type == 'returning_clause' && returning_clause.columns.type == 'list_expr') {
    returning_clause.columns.items.forEach((column) => {
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
    type: 'update',
    fields,
    relations
  }
}
