import { Schema } from '../src/schema'
import { Parser } from '../src/parser'

describe('validates relations', () => {
  const schema: Schema = {}
  const parser = new Parser(schema)

  test('raises when select table not found', () => {
    expect(() => {
      parser.parse('select * from products')
    }).toThrowError('Unknown relation `products`')
  })

  test('raises when insert table not found', () => {
    expect(() => {
      parser.parse('insert into products values (1, 2)')
    }).toThrowError('Unknown relation `products`')
  })

  test('raises when upsert table not found', () => {
    expect(() => {
      parser.parse('insert into products values (1, 2) on conflict (id) do nothing')
    }).toThrowError('Unknown relation `products`')
  })

  test('raises when update table not found', () => {
    expect(() => {
      parser.parse('update products set price = 0')
    }).toThrowError('Unknown relation `products`')
  })

  test('raises when delete table not found', () => {
    expect(() => {
      parser.parse('delete from products')
    }).toThrowError('Unknown relation `products`')
  })
})

describe("parses input parameters", () => {
  const schema: Schema = {
    products: {}
  }

  const parser = new Parser(schema)

  describe('select', () => {
    test('when no input params, returns empty array', () => {
      const result = parser.parse('select * from products')

      expect(result).toMatchObject({
        type: 'select',
        inputs: []
      })
    })

    test('when input params but no frontmatter, returns any', () => {
      const result = parser.parse('select * from products where price > :min_price')

      expect(result).toMatchObject({
        type: 'select',
        inputs: [
          { name: 'min_price', type: 'any' }
        ]
      })
    })

    describe('when input params have frontmatter', () => {
      test('handles basic types', () => {
        const result = parser.parse(`---
name: string
min_price: number
---
select * from products where name = :name and price > :min_price
`)

        console.log(result)

        expect(result).toMatchObject({
          type: 'select',
          inputs: [
            { name: 'name', type: 'string', array: false, nullable: false },
            { name: 'min_price', type: 'number', array: false, nullable: false }
          ]
        })
      })

      test('handles arrays', () => {
        const result = parser.parse(`---
  tags: string[]
  ---
  select * from products where :tags = any(tags)`)

        expect(result).toMatchObject({
          type: 'select',
          inputs: [
            { name: 'tags', type: 'string', array: true , nullable: false }
          ]
        })
      })

      test('handles nullable', () => {
        const result = parser.parse(`---
  tag?: string
  ---
  select * from products where :tag = any(tags)`)

        expect(result).toMatchObject({
          type: 'select',
          inputs: [
            { name: 'tags', type: 'string', array: true, nullable: true }
          ]
        })
      })
    })
  })

  describe('insert', () => {
    test('when no input params, returns empty array', () => {
      const result = parser.parse('insert into products values ( 1, 2 )')

      expect(result).toMatchObject({
        type: 'insert',
        inputs: []
      })
    })

    test('when input params but no frontmatter, returns any', () => {
      const result = parser.parse('insert into products values(:price)')

      expect(result).toMatchObject({
        type: 'insert',
        inputs: [
          { name: 'price', type: 'any' }
        ]
      })
    })

    test('when input params have frontmatter', () => {
      const result = parser.parse(`---
name: string
price: number
---
insert into products values (:name, :price)`)

      expect(result).toMatchObject({
        type: 'select',
        inputs: [
          { name: 'name', type: 'string', array: false, nullable: false },
          { name: 'price', type: 'number', array: false, nullable: false }
        ]
      })
    })
  })

  describe('update', () => {
    test('when no input params, returns empty array', () => {
      const result = parser.parse('update products set price = 0')

      expect(result).toMatchObject({
        type: 'update',
        inputs: []
      })
    })

    test('when input params but no frontmatter, returns any', () => {
      const result = parser.parse('update products set price = :price')

      expect(result).toMatchObject({
        type: 'update',
        inputs: [
          { name: 'price', type: 'any' }
        ]
      })
    })

    test('when input params have frontmatter', () => {
      const result = parser.parse(`---
id: string
price: number
---
update products set price=:price where id=:id`)

      expect(result).toMatchObject({
        type: 'update',
        inputs: [
          { name: 'id', type: 'string', array: false, nullable: false },
          { name: 'price', type: 'number', array: false, nullable: false }
        ]
      })
    })
  })

  describe('delete', () => {
    test('when no input params, returns empty array', () => {
      const result = parser.parse('delete from products')

      expect(result).toMatchObject({
        type: 'delete',
        inputs: []
      })
    })

    test('when input params but no frontmatter, returns any', () => {
      const result = parser.parse('delete from products where price = :price')

      expect(result).toMatchObject({
        type: 'delete',
        inputs: [
          { name: 'price', type: 'any' }
        ]
      })
    })

    test('when input params have frontmatter', () => {
      const result = parser.parse(`---
id: string
price: number
---
delete from products where price=:price and id=:id`)

      expect(result).toMatchObject({
        type: 'delete',
        inputs: [
          { name: 'id', type: 'string', array: false, nullable: false },
          { name: 'price', type: 'number', array: false, nullable: false }
        ]
      })
    })
  })
})
