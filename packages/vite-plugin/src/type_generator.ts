export interface Field {
  name: string
  type: string
}

export interface Interface {
  name: string
  fields: Field[]
}

export interface Func {
  name: string
  params: Field[]
  returns: string
}

export interface Options {
  module: string
  interfaces?: Interface[]
  functions?: Func[]
}

export function generate(options: Options): string {
  return `declare module "${options.module}" {` +
    (options.interfaces?.length ? '\n' + generateInterfaces(options.interfaces) + '\n' : '') +
    (options.functions?.length ? '\n' + generateFunctions(options.functions) + '\n' : '') +
  `}`
}

function generateInterfaces(interfaces: Interface[]): string {
  return '\n' + interfaces.map((def) => {
    return `  export interface ${def.name} {
${def.fields.map((field) => `    ${field.name}: ${field.type}`).join('\n')}
  }\n`
  }).join('\n')
}

function generateFunctions(functions: Func[]): string {
  return '\n' + functions.map((func) => {
    return `  export function ${func.name}(${func.params.map((field) => `${field.name}: ${field.type}`).join(', ')}): ${func.returns}`
  }).join('\n')
}
