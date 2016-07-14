import React from 'react';
import _ from 'lodash';
import testcheck, {gen} from 'testcheck';
import reduce from 'lodash/reduce';
import extend from 'lodash/extend';
import isObject from 'lodash/isObject';
import faker from 'faker';

const undefinedGen = gen.return(undefined);

// TODO: this is not exhaustive
const tagNamesGen = gen.oneOf(['div', 'span', 'input', 'img', 'a']);
const elementGen = gen.map(tagName => React.createElement(tagName), tagNamesGen);

// TODO: this is not exaustive
const nodeGen = gen.oneOf([
  gen.string,
  gen.int,
  elementGen
]);

const funcGen = gen.return(function noop() {});

const createSymbol = type => {
  let result;
  const Symbol = global.Symbol;

  if (typeof Symbol === 'function') {
    if (Symbol[type]) {
      result = Symbol[type];
    } else {
      result = Symbol(type);
      Symbol[type] = result;
    }
  } else {
    result = `@@${type}`;
  }

  return result;
};

const genPropSymbol = createSymbol('gen');
const metaSymbol = createSymbol('meta');

export function sample(propTypes, opts) {
  const { maxSize = 10, times = 20 } = opts;
  return testcheck.sample(genProps(propTypes), {maxSize, times});
}

export function getMeta(obj) {
  if (obj[metaSymbol]) {
    return obj[metaSymbol];
  }

  if (isObject(obj)) {
    obj[metaSymbol] = _.mapValues(obj, fn => fn[metaSymbol]);
    return obj[metaSymbol];
  }

  throw new Error('wat?');
}

export function genProps(obj) {
  if (obj[genPropSymbol]) {
    return obj[genPropSymbol];
  }

  if (isObject(obj)) {
    obj[genPropSymbol] = wrapObject(obj);
    return obj[genPropSymbol];
  }

  throw new Error('wat?');
}

function wrapObject(obj) {
  return reduce(
    obj,
    (genAcc, value, key) => {
      return gen.bind(
        genAcc,
        acc =>
          gen.map(rnd => extend({}, acc, { [key]: rnd }), genProps(value))
      );
    },
    gen.return({})
  );
}

function addFakerSupport(data, type, primGen) {
  if (type === "string" && data.exampleTemplate !== undefined) {
    return gen.map(() => faker.fake(data.exampleTemplate),
                   gen.return(null));
  } else if (data.exampleTemplate !== undefined) {
    throw new Error(`Invalid type ${type} with exampleTemplate`);
  } else {
    return primGen;
  }
}

// TODO dry
function wrapPrimitive(typeFn, primGen, type) {

  // creates a new fn
  const fn = typeFn.bind(null);
  fn[genPropSymbol] = gen.oneOf([primGen, undefinedGen]);
  fn[metaSymbol] = { type, required: false };

  fn.isRequired = typeFn.isRequired.bind(null);
  fn.isRequired[genPropSymbol] = primGen;
  fn.isRequired[metaSymbol] = { type, required: true };

  fn.meta = data => {
    const wrapper = typeFn.bind(null);

    wrapper[genPropSymbol] = gen.oneOf([addFakerSupport(data, type, primGen),
                                        undefinedGen]);
    wrapper[metaSymbol] = { ...data, type, required: false };


    wrapper.isRequired = typeFn.isRequired.bind(null);
    wrapper.isRequired[genPropSymbol] = addFakerSupport(data, type, primGen);
    wrapper.isRequired[metaSymbol] = { ...data, type, required: true };

    return wrapper;
  };

  fn.isRequired.meta = data => {
    const wrapper = typeFn.isRequired.bind(null);

    wrapper[genPropSymbol] = addFakerSupport(data, type, primGen);
    wrapper[metaSymbol] = { ...data, type, required: true };

    return wrapper;
  };

  return fn;
}

function wrappedArrayOf(typeFn) {
  const arrayGen = gen.array(genProps(typeFn));
  return wrapPrimitive(
    React.PropTypes.arrayOf(typeFn),
    arrayGen,
    ['array', typeFn[metaSymbol]]
  );
}

function wrappedObjectOf(typeFn) {
  const objGen = gen.object(genProps(typeFn));
  return wrapPrimitive(
    React.PropTypes.objectOf(typeFn),
    objGen,
    ['object', typeFn[metaSymbol]]
  );
}

function wrappedShape(typeObj) {
  const shapeGen = genProps(typeObj);
  return wrapPrimitive(
    React.PropTypes.shape(typeObj),
    shapeGen,
    ['shape', _.mapValues(typeObj, fn => fn[metaSymbol])]
  );
}

function wrappedOneOfType(typeFns) {
  const oneOfTypeGen = gen.oneOf(typeFns.map(genProps));
  return wrapPrimitive(
    React.PropTypes.oneOfType(typeFns),
    oneOfTypeGen,
    ['oneOfType', _.map(typeFns, fn => fn[metaSymbol])]
  );
}

function wrappedOneOf(objs) {
  const oneOfGen = gen.returnOneOf(objs);
  return wrapPrimitive(
    React.PropTypes.oneOf(objs),
    oneOfGen,
    ['oneOf', objs]
  );
}

// TODO: this is not entirely correct because an 'instance' can be a class
function wrappedInstanceOf(Component) {
  const propsGen = wrapObject(Component.propTypes);
  const instanceOfGen = gen.map(props => <Component {...props} />, propsGen);

  return wrapPrimitive(
    React.PropTypes.instanceOf(Component),
    instanceOfGen,
    ['instance', Component]
  );
}

export const PropTypes = {
  array: wrapPrimitive(React.PropTypes.array, gen.array, 'array'),
  bool: wrapPrimitive(React.PropTypes.bool, gen.boolean, 'boolean'),
  number: wrapPrimitive(React.PropTypes.number, gen.int, 'number'),
  object: wrapPrimitive(
    React.PropTypes.object,
    gen.object(gen.alphaNumString, gen.any),
    'object'
  ),
  string: wrapPrimitive(React.PropTypes.string, gen.alphaNumString, 'string'),
  any: wrapPrimitive(React.PropTypes.any, gen.any, 'anything'),
  element: wrapPrimitive(React.PropTypes.element, elementGen, 'element'),
  node: wrapPrimitive(React.PropTypes.node, nodeGen, 'node'),
  func: wrapPrimitive(React.PropTypes.func, funcGen, 'function'),
  instanceOf: wrappedInstanceOf,
  oneOf: wrappedOneOf,
  oneOfType: wrappedOneOfType,
  arrayOf: wrappedArrayOf,
  objectOf: wrappedObjectOf,
  shape: wrappedShape
};
