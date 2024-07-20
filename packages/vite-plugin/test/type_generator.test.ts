import { generate } from '../src/type_generator.js'

test('generate module', () => {
  const data = generate({
    module: 'db/products.sql'
  })

  expect(data).toEqual(`declare module "db/products.sql" {}`)
})

test('generate types', () => {
  const data = generate({
    module: 'db/products.sql',
    interfaces: [
      {
        name: 'Result',
        fields: [
          { name: 'id', type: 'number' },
          { name: 'name', type: 'string' }
        ]
      },
      {
        name: 'Input',
        fields: [
          { name: 'price', type: 'number' }
        ]
      }
    ]
  })

  expect(data).toEqual(`declare module "db/products.sql" {

  export interface Result {
    id: number
    name: string
  }

  export interface Input {
    price: number
  }

}`)
})

test('generate functions', () => {
  const data = generate({
    module: 'db/products.sql',
    functions: [
      {
        name: 'query',
        params: [
          { name: 'input', type: 'Input' },
        ],
        returns: 'Promise<Result[]>'
      },
      {
        name: 'one',
        params: [
          { name: 'input', type: 'Input' }
        ],
        returns: 'Promise<Result>'
      }
    ]
  })

  expect(data).toEqual(`declare module "db/products.sql" {

  export function query(input: Input): Promise<Result[]>
  export function one(input: Input): Promise<Result>
}`)
})
