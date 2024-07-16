#!/bin/env node
import sade from 'sade'

const prog = sade('requel')

prog
  .command('init')
  .describe('Initialize the project')
  .example('init')
  .action(() => {
    console.log('TODO')
  })

prog
  .command('db pull')
  .describe('Pull the database schema')
  .example('db pull')
  .action(() => {
    console.log('TODO')
  })

prog
  .command('generate')
  .describe('Generate types')
  .example('generate types for all .sql files')
  .action(() => {
    console.log('TODO')
  })

prog.parse(process.argv)
