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

const createSymbol = type => {
  let result
  const Symbol = global.Symbol

  if (typeof Symbol === 'function') {
    if (Symbol[type]) {
      result = Symbol[type]
    } else {
      result = Symbol(type)
      Symbol[type] = result
    }
  } else {
    result = `@@${type}`
  }

  return result
}

export const genPropSymbol = createSymbol('gen')
export const metaSymbol = createSymbol('meta')
export const requiredSymbol = createSymbol('required')

export function sample (propTypes, opts) {
  const { maxSize = 10, times = 20 } = opts
  return testcheck.sample(genProps(propTypes), {maxSize, times})
}

export function genProps (obj) {
  if (obj[genPropSymbol]) {
    return obj[genPropSymbol]
  }

  if (isObject(obj)) {
    obj[genPropSymbol] = wrapObject(obj)
    return obj[genPropSymbol]
  }

  throw 'wat?'
}

function wrapObject (obj) {
  return reduce(obj, (genAcc, value, key) => {
    return gen.bind(genAcc, acc =>
      gen.map(rnd => extend({}, acc, { [key]: rnd }), genProps(value))
    )
  }, gen.return({}))
}

// TODO dry
function wrapPrimative (typeFn, primGen) {
  // creates a new fn
  const fn = typeFn.bind(null)
  fn[genPropSymbol] = gen.oneOf([primGen, undefinedGen])
  fn[requiredSymbol] = false

  fn.isRequired = typeFn.isRequired.bind(null)
  fn.isRequired[genPropSymbol] = primGen
  fn.isRequired[requiredSymbol] = true

  fn.isRequired.meta = data => {
    const wrapper = typeFn.isRequired.bind(null)
    wrapper[genPropSymbol] = primGen
    wrapper[requiredSymbol] = true
    wrapper[metaSymbol] = data

    return wrapper
  }

  fn.meta = data => {
    const wrapper = typeFn.bind(null)
    wrapper[genPropSymbol] = gen.oneOf([primGen, undefinedGen])
    wrapper[requiredSymbol] = false
    wrapper[metaSymbol] = data

    wrapper.isRequired = typeFn.isRequired.bind(null)
    wrapper.isRequired[genPropSymbol] = primGen
    wrapper.isRequired[requiredSymbol] = true
    wrapper.isRequired[metaSymbol] = data

    return wrapper
  }

  return fn
}

function wrappedArrayOf (typeFn) {
  const arrayGen = gen.array(genProps(typeFn))
  return wrapPrimative(React.PropTypes.arrayOf(typeFn), arrayGen)
}

function wrappedObjectOf (typeFn) {
  const objGen = gen.object(genProps(typeFn))
  return wrapPrimative(React.PropTypes.objectOf(typeFn), objGen)
}

function wrappedShape (typeFn) {
  const shapeGen = genProps(typeFn)
  return wrapPrimative(React.PropTypes.shape(typeFn), shapeGen)
}

function wrappedOneOfType (typeFns) {
  const oneOfTypeGen = gen.oneOf(typeFns.map(wrap))
  return wrapPrimative(React.PropTypes.oneOfType(typeFns), oneOfTypeGen)
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
