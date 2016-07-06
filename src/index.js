import React from 'react'
import testcheck, {gen} from 'testcheck'
import reduce from 'lodash/reduce'
import extend from 'lodash/extend'
import isObject from 'lodash/isObject'

const undefinedGen = gen.return(undefined)

// TODO: this is not exhaustive
const tagNamesGen = gen.oneOf(['div', 'span', 'input', 'img', 'a'])
const elementGen = gen.map(tagName => React.createElement(tagName), tagNamesGen)

// TODO: this is not exaustive
const nodeGen = gen.oneOf([
  gen.string,
  gen.int,
  elementGen
])

const funcGen = gen.return(function noop () {})

export const symbol = (function () {
  let result
  const Symbol = global.Symbol

  if (typeof Symbol === 'function') {
    if (Symbol.genProp) {
      result = Symbol.genProp
    } else {
      result = Symbol('genProp')
      Symbol.genProp = result
    }
  } else {
    result = `@@genProp`
  }

  return result
}())

export function sample (propTypes, opts) {
  const { maxSize = 10, times = 20 } = opts
  return testcheck.sample(wrap(propTypes), {maxSize, times})
}

export function wrap (obj) {
  if (obj[symbol]) {
    return obj[symbol]
  }

  if (isObject(obj)) {
    obj[symbol] = wrapObject(obj)
    return obj[symbol]
  }

  throw 'wat?'
}

function wrapObject (obj) {
  return reduce(obj, (genAcc, value, key) => {
    return gen.bind(genAcc, acc =>
      gen.map(rnd => extend({}, acc, { [key]: rnd }), wrap(value))
    )
  }, gen.return({}))
}

function wrapPrimative (type, primGen) {
  // creates a new fn
  const fn = type.bind(null)
  fn.isRequired = type.isRequired.bind(null)

  fn[symbol] = gen.oneOf([primGen, undefinedGen])
  fn.isRequired[symbol] = primGen

  return fn
}

function wrappedArrayOf (type) {
  const arrayGen = gen.array(wrap(type))
  return wrapPrimative(React.PropTypes.arrayOf(type), arrayGen)
}

function wrappedObjectOf (type) {
  const objGen = gen.object(wrap(type))
  return wrapPrimative(React.PropTypes.objectOf(type), objGen)
}

function wrappedShape (type) {
  const shapeGen = wrap(type)
  return wrapPrimative(React.PropTypes.shape(type), shapeGen)
}

function wrappedOneOfType (types) {
  const oneOfTypeGen = gen.oneOf(types.map(wrap))
  return wrapPrimative(React.PropTypes.oneOfType(types), oneOfTypeGen)
}

function wrappedOneOf (objs) {
  const oneOfGen = gen.returnOneOf(objs)
  return wrapPrimative(React.PropTypes.oneOf(objs), oneOfGen)
}

// TODO: this is not entirely correct because an 'instance' can be a class
function wrappedInstanceOf (Component) {
  const propsGen = wrapObject(Component.propTypes)
  const instanceOfGen = gen.map(props => <Component {...props} />, propsGen)

  return wrapPrimative(React.PropTypes.instanceOf(Component), instanceOfGen)
}

export const PropTypes = {
  array: wrapPrimative(React.PropTypes.array, gen.array),
  bool: wrapPrimative(React.PropTypes.bool, gen.boolean),
  number: wrapPrimative(React.PropTypes.number, gen.int),
  object: wrapPrimative(React.PropTypes.object, gen.object(gen.alphaNumString, gen.any)),
  string: wrapPrimative(React.PropTypes.string, gen.alphaNumString),
  any: wrapPrimative(React.PropTypes.any, gen.any),
  element: wrapPrimative(React.PropTypes.element, elementGen),
  node: wrapPrimative(React.PropTypes.node, nodeGen),
  func: wrapPrimative(React.PropTypes.func, funcGen),
  instanceOf: wrappedInstanceOf,
  oneOf: wrappedOneOf,
  oneOfType: wrappedOneOfType,
  arrayOf: wrappedArrayOf,
  objectOf: wrappedObjectOf,
  shape: wrappedShape
}
