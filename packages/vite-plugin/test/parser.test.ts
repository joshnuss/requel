import { Schema } from '../src/schema'
import { Parser } from '../src/parser'

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
