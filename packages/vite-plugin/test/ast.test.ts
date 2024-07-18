import { ast } from '../src/ast.js'

const options = {
  dialect: 'postgresql'
}

describe('ast', () => {
  test('unsuported statement', () => {
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
})
