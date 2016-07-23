import React from 'react';
import _ from 'lodash';
import {gen} from 'testcheck';
import faker from 'faker';
import {getMeta} from './meta';
import {genExtra} from './genExtra';

const typeMap = {
  bool: () => gen.boolean,
  number: () => gen.int,
  string: (_undefined, data) => {
    const {exampleTemplate} = data;

    if (typeof exampleTemplate !== 'undefined') {
      return gen.map(() => faker.fake(exampleTemplate), gen.return(null));
    } else {
      return gen.alphaNumString
    }
  },
  any: () => gen.any,
  element: () => genExtra.element,
  node: () => genExtra.node,
  func: () => funcGen,
  arrayOf: meta => gen.array(genSample(meta)),
  objectOf: meta => gen.object(gen.alphaNumString, genSample(meta)),
  oneOf: arr => gen.returnOneOf(arr),
  oneOfType: metas => gen.oneOf(_.map(metas, genSample)),
  shape: meta => genSample(meta),
  instanceOf: Component => gen.map(props => <Component {...props} />, genSample(getMeta(Component.propTypes)))
};

const funcGen = gen.return(function noop() {});

// TODO can probably use some variation of gen.object here instead
function genObject (obj) {
  return _.reduce(obj, (genAcc, value, key) =>
    gen.bind(genAcc, acc =>
      gen.map(rnd => _.extend({}, acc, { [key]: rnd }), genValue(value))
    )
    , gen.return({}));
}

function genValue(value) {
  const [typeKey, meta] = value.type;
  const generator = typeMap[typeKey](meta, value);

  return handleRequired(generator, value.isRequired);
}

function handleRequired (valueGen, isRequired) {
  if (isRequired) {
    return valueGen;
  }

  return gen.oneOf([valueGen, gen.undefined]);
}


export function genSample(meta) {
  if (_.isObject(meta)) {
    return genObject(meta);
  } else {
    return genValue(meta);
  }
}
