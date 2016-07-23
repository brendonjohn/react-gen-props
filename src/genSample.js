import React from 'react';
import _ from 'lodash';
import {gen} from 'testcheck';
import faker from 'faker';

import {getMeta} from './meta';

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

const typeMap = {
  boolean: () => gen.boolean,
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
  element: () => elementGen,
  node: () => nodeGen,
  func: () => funcGen,
  arrayOf: meta => gen.array(getGen(meta)),
  objectOf: meta => gen.object(gen.alphaNumString, getGen(meta)),
  oneOf: arr => gen.returnOneOf(arr),
  oneOfType: metas => gen.oneOf(_.map(metas, m => getGen(m))),
  shape: meta => getGen(meta),
  instanceOf: Component => gen.map(props => <Component {...props} />, getGen(getMeta(Component.propTypes)))
};

const funcGen = gen.return(function noop() {});

function getGen(meta) {
  if (_.isObject(meta)) {
    return genObject(meta);
  } else {
    return genValue(meta);
  }
}

// TODO can probably use some variation of gen.object here instead
function genObject (obj) {
  return _.reduce(obj, (genAcc, value, key) =>
    gen.bind(genAcc, acc =>
      gen.map(rnd => _.extend({}, acc, { [key]: rnd }), genValue(value))
    )
    , gen.return({}));
}

function genValue(value) {
  const {type, isRequired} = value;
  const [typeKey, meta] = type;
  const generator = typeMap[typeKey](meta, value);

  return handleRequired(generator, isRequired);
}

function handleRequired (valueGen, isRequired) {
  if (isRequired) {
    return valueGen;
  }

  return gen.oneOf([valueGen, undefinedGen]);
}


export function genSample(meta) {
  return getGen(meta);
}
