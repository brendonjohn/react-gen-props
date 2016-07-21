import React from 'react';
import _ from 'lodash';
import testcheck, {gen} from 'testcheck';
import {getMeta} from './getMeta';
import {getSample} from './getSample';

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
  boolean: () => [gen.return(true), gen.return(false)],

  number: () => [gen.int],

  string: (_undefined, data) => {
    const {exampleTemplate} = data;

    if (typeof exampleTemplate !== 'undefined') {
      return [gen.map(() => faker.fake(exampleTemplate), gen.return(null))];
    } else {
      return [gen.alphaNumString]
    }
  },

  any: () => [gen.any],

  element: () => [elementGen],

  node: () => [nodeGen],

  func: () => [funcGen],

  arrayOf: value => {
    const [typeKey, meta] = value.type;
    const gens = typeMap[typeKey](meta, value);

    return [gen.map(
      () => _.shuffle(gens).map(getSingle),
      gen.null
    )]
  },

  objectOf: value => {
    const [typeKey, meta] = value.type;
    const gens = typeMap[typeKey](meta, value);

    return [
      _.reduce(gens, (accGen, g) =>
        gen.bind(accGen, acc =>
          gen.bind(g, value =>
            gen.map(
              key => _.extend({}, acc, { [key]: value }),
              gen.resize(50, gen.alphaNumString)
            )
          )
        )
      , gen.return({}))
    ];
  },

  oneOf: arr => arr.map(a => gen.return(a)),

  oneOfType: values => {
    return _.flatten(
      values.map(value => {
        const [typeKey, meta] = value.type;
        return typeMap[typeKey](meta, value);
      })
    );
  },

  shape: meta => getPermuatations(meta).map(genObject),

  instanceOf: Component => {
    const meta = getMeta(Component.propTypes);
    const permutations = getPermuatations(meta).map(genObject);

    return permutations.map(perm =>
      gen.map(props => <Component {...props} />, perm)
    );
  }
};

function genObject(obj) {
  return gen.object(obj);
}

function getSingle(generator) {
  return testcheck.sample(generator, { times: 1 })[0];
}

function handleRequired(gens, isRequired) {
  if (isRequired) {
    return gens
  }

  return gens.concat(gen.undefined);
}

function getPermuatations(data) {
  return _.reduce(data, (acc, value, key) => {
    const [typeKey, meta] = value.type;
    const gens = typeMap[typeKey](meta, value);

    const objs = _.map(
      handleRequired(gens, value.isRequired),
      g => ({ [key]: g })
    );

    return _.reduce(acc, (acc0, item) => {
      const list = _.reduce(objs, (acc1, obj) => {
        return acc1.concat(_.extend({}, item, obj))
      }, []);

      return acc0.concat(list);
    }, []);
  }, [undefined]);
}

export function getExaustive(propTypes) {
  return getPermuatations(getMeta(propTypes))
           .map(genObject)
           .map(getSingle)
}
