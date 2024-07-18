import { ast } from '../src/ast.js'
import type { Options } from '../src/ast.ts'

const options: Options = {
  dialect: 'postgresql'
}

test('unsupported statement', () => {
  expect(() => {
    ast('truncate table products', options)
  }).toThrowError('Unsupported statement `truncate_stmt` `truncate table products`')
})

describe('select', () => {
  test('star query', () => {
    const result = ast('select * from products', options)

    expect(result).toMatchObject([{
      type: 'select',
      fields: [
        { type: 'wildcard', name: '*' }
      ],
      relations: [
        { name: 'products', alias: null }
      ]
    }])
  })

  test('multiple from', () => {
    const result = ast('select * from products, categories', options)

    expect(result).toMatchObject([{
      type: 'select',
      fields: [
        { type: 'wildcard', name: '*' }
      ],
      relations: [
        { name: 'products', alias: null },
        { name: 'categories', alias: null }
      ]
    }])
  })

  test('with from alias', () => {
    const result = ast('select * from products as prod', options)

    expect(result).toMatchObject([{
      type: 'select',
      fields: [
        { type: 'wildcard', name: '*' }
      ],
      relations: [
        { name: 'products', alias: 'prod' }
      ]
    }])
  })

  test('with multiple from alias', () => {
    const result = ast('select * from products as prod, categories as cat', options)

    expect(result).toMatchObject([{
      type: 'select',
      fields: [
        { type: 'wildcard', name: '*' }
      ],
      relations: [
        { name: 'products', alias: 'prod' },
        { name: 'categories', alias: 'cat' }
      ]
    }])
  })

  test('with column names', () => {
    const result = ast('select id, name, price from products', options)

    expect(result).toMatchObject([{
      type: 'select',
      fields: [
        { type: 'column', name: 'id' },
        { type: 'column', name: 'name' },
        { type: 'column', name: 'price' }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('with column aliases', () => {
    const result = ast('select id, price as amount from products', options)

    expect(result).toMatchObject([{
      type: 'select',
      fields: [
        { type: 'column', name: 'id' },
        { type: 'column', name: 'price', alias: 'amount' }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })
})

describe('delete', () => {
  test('returns nothing', () => {
    const result = ast('delete from products', options)

    expect(result).toMatchObject([{
      type: 'delete',
      fields: [],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns star', () => {
    const result = ast('delete from products returning *', options)

    expect(result).toMatchObject([{
      type: 'delete',
      fields: [
        {
          type: 'wildcard',
          name: '*'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns field names', () => {
    const result = ast('delete from products returning id, name', options)

    expect(result).toMatchObject([{
      type: 'delete',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'name'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns field alias', () => {
    const result = ast('delete from products returning id, price as amount', options)

    expect(result).toMatchObject([{
      type: 'delete',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'price',
          alias: 'amount'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('with from alias', () => {
    const result = ast('delete from products as prod returning id, name', options)

    expect(result).toMatchObject([{
      type: 'delete',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'name'
        }
      ],
      relations: [
        { name: 'products', alias: 'prod' },
      ]
    }])
  })
})

describe('insert', () => {
  test('returns nothing', () => {
    const result = ast('insert into products (name, price) values (1, 2)', options)

    expect(result).toMatchObject([{
      type: 'insert',
      fields: [],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns star', () => {
    const result = ast('insert into products (name, price) values (1, 2) returning *', options)

    expect(result).toMatchObject([{
      type: 'insert',
      fields: [
        {
          type: 'wildcard',
          name: '*'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns field names', () => {
    const result = ast('insert into products (name, price) values (1, 2) returning id, name', options)

    expect(result).toMatchObject([{
      type: 'insert',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'name'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns field alias', () => {
    const result = ast('insert into products (name, price) values (1, 2) returning id, price as amount', options)

    expect(result).toMatchObject([{
      type: 'insert',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'price',
          alias: 'amount'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('with from alias', () => {
    const result = ast('insert into products as prod (name, price) values (1, 2) returning id, name', options)

    expect(result).toMatchObject([{
      type: 'insert',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'name'
        }
      ],
      relations: [
        { name: 'products', alias: 'prod' },
      ]
    }])
  })

  test('when `on conflict` specified, statement is considered an upsert', () => {
    const result = ast('insert into products (name, price) values (1, 2) on conflict do nothing returning id, name', options)

    expect(result).toMatchObject([{
      type: 'upsert',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'name'
        }
      ],
      relations: [
        { name: 'products' },
      ]
    }])
  })
})

describe('update', () => {
  test('returns nothing', () => {
    const result = ast('update products set price = 0', options)

    expect(result).toMatchObject([{
      type: 'update',
      fields: [],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns star', () => {
    const result = ast('update products set price = 0 returning *', options)

    expect(result).toMatchObject([{
      type: 'update',
      fields: [
        {
          type: 'wildcard',
          name: '*'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns field names', () => {
    const result = ast('update products set price = 0 returning id, name', options)

    expect(result).toMatchObject([{
      type: 'update',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'name'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('returns field alias', () => {
    const result = ast('update products set price = 0 returning id, price as amount', options)

    expect(result).toMatchObject([{
      type: 'update',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'price',
          alias: 'amount'
        }
      ],
      relations: [
        { name: 'products', alias: null },
      ]
    }])
  })

  test('with from alias', () => {
    const result = ast('update products as prod set price = 0 returning id, name', options)

    expect(result).toMatchObject([{
      type: 'update',
      fields: [
        {
          type: 'column',
          name: 'id'
        },
        {
          type: 'column',
          name: 'name'
        }
      ],
      relations: [
        { name: 'products', alias: 'prod' },
      ]
    }])
  })
})
