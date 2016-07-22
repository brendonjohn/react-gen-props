import React from 'react';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import {getMeta, setMeta} from './meta';

function wrapPrimitive(typeFn, type, isRequired = false) {
  const fn = typeFn.bind(null);
  setMeta(fn, { type, isRequired });

  fn.meta = data => {
    const wrapper = typeFn.bind(null);
    setMeta(wrapper, { ...data, type, isRequired });

    if (!isRequired) {
      wrapper.isRequired = typeFn.isRequired.bind(null);
      setMeta(wrapper.isRequired, { ...data, type, isRequired: true });
    }

    return wrapper;
  };

  if (!isRequired) {
    fn.isRequired = wrapPrimitive(typeFn.isRequired, type, true)
  }

  return fn
}

function wrappedArrayOf(typeFn) {
  return wrapPrimitive(
    React.PropTypes.arrayOf(typeFn),
    ['arrayOf', getMeta(typeFn)]
  );
}

function wrappedObjectOf(typeFn) {
  return wrapPrimitive(
    React.PropTypes.objectOf(typeFn),
    ['objectOf', getMeta(typeFn)]
  );
}

function wrappedShape(typeObj) {
  return wrapPrimitive(
    React.PropTypes.shape(typeObj),
    ['shape', mapValues(typeObj, getMeta)]
  );
}

function wrappedOneOfType(typeFns) {
  return wrapPrimitive(
    React.PropTypes.oneOfType(typeFns),
    ['oneOfType', map(typeFns, getMeta)]
  );
}

function wrappedOneOf(objs) {
  return wrapPrimitive(
    React.PropTypes.oneOf(objs),
    ['oneOf', objs]
  );
}

function wrappedInstanceOf(Component) {
  return wrapPrimitive(
    React.PropTypes.instanceOf(Component),
    ['instanceOf', Component]
  );
}

export const PropTypes = {
  bool: wrapPrimitive(React.PropTypes.bool, ['boolean']),
  number: wrapPrimitive(React.PropTypes.number, ['number']),
  string: wrapPrimitive(React.PropTypes.string, ['string']),
  any: wrapPrimitive(React.PropTypes.any, ['anything']),
  element: wrapPrimitive(React.PropTypes.element, ['element']),
  node: wrapPrimitive(React.PropTypes.node, ['node']),
  func: wrapPrimitive(React.PropTypes.func, ['function']),
  ...(React.PropTypes.symbol ? { symbol: wrapPrimitive(React.PropTypes.symbol, ['symbol']) } : {}),
  array: wrapPrimitive(React.PropTypes.array, ['arrayOf', 'any']),
  object: wrapPrimitive(React.PropTypes.object, ['objectOf', 'any']),
  instanceOf: wrappedInstanceOf,
  oneOf: wrappedOneOf,
  oneOfType: wrappedOneOfType,
  arrayOf: wrappedArrayOf,
  objectOf: wrappedObjectOf,
  shape: wrappedShape
};
