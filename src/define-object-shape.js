import { validateSqlAST } from './util'

// generate an object that defines the correct nesting shape for our GraphQL
// this will be used by the library NestHydrationJS, check out their docs
export default function defineObjectShape(topNode) {
  validateSqlAST(topNode)
  return _defineObjectShape(null, '', topNode)
}

function _defineObjectShape(parent, prefix, node) {
  // if this table has a parent, prefix with the parent name and 2 underscores
  const prefixToPass = parent ? prefix + node.as + '__' : prefix

  const fieldDefinition = {}

  for (let child of node.children) {
    switch (child.type) {
    case 'column':
      fieldDefinition[child.fieldName] = prefixToPass + child.as
      break
    case 'composite':
      fieldDefinition[child.fieldName] = prefixToPass + child.as
      break
    case 'columnDeps':
      for (let name in child.names) {
        fieldDefinition[name] = prefixToPass + child.names[name]
      }
      break
    case 'expression':
      fieldDefinition[child.fieldName] = prefixToPass + child.as
      break
    case 'union':
    case 'table':
      if (child.sqlBatch) {
        fieldDefinition[child.sqlBatch.parentKey.fieldName] = prefixToPass + child.sqlBatch.parentKey.as
      } else {
        const definition = _defineObjectShape(node, prefixToPass, child)
        fieldDefinition[child.fieldName] = definition
      }
    }
  }

  for (let typeName in node.typedChildren || {}) {
    for (let child of node.typedChildren[typeName]) {
      switch (child.type) {
      case 'column':
        fieldDefinition[child.fieldName + typeName] = prefixToPass + child.as
        break
      case 'composite':
        fieldDefinition[child.fieldName + typeName] = prefixToPass + child.as
        break
      case 'columnDeps':
        for (let name in child.names) {
          fieldDefinition[name + typeName] = prefixToPass + child.names[name]
        }
        break
      case 'expression':
        fieldDefinition[child.fieldName + typeName] = prefixToPass + child.as
        break
      case 'union':
      case 'table':
        if (child.sqlBatch) {
          fieldDefinition[child.sqlBatch.parentKey.fieldName + typeName] = prefixToPass + child.sqlBatch.parentKey.as
        } else {
          const definition = _defineObjectShape(node, prefixToPass, child)
          fieldDefinition[child.fieldName + typeName] = definition
        }
      }
    }
  }

  // if we need many, just wrap the field definition in an array
  if (node.grabMany) {
    return [ fieldDefinition ]
  // otherwise, it will just grab the first result
  } else {
    return fieldDefinition
  }
}
