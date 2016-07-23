import React from 'react';
import _ from 'lodash';
import {gen} from 'testcheck';
import faker from 'faker';
import {getMeta} from './meta';
import {genExtra} from './genExtra';

const typeMap = {
  bool: () => [gen.return(true), gen.return(false)],
  number: () => [gen.int],
  string: (_undefined, data) => {
    if (_.isString(data.exampleTemplate)) {
      return [gen.map(() => faker.fake(data.exampleTemplate), gen.return(null))];
    } else {
      return [gen.alphaNumString]
    }
  },
  any: () => [gen.any],
  element: () => [genExtra.element],
  node: () => [genExtra.node],
  func: () => [funcGen],
  arrayOf: value => {
    const [typeKey, meta] = value.type;
    const gens = typeMap[typeKey](meta, value);
    const shuffled = _.shuffle(gens);

    return [
      _.reduce(shuffled, (acc0, gen0) =>
        gen.bind(acc0, acc =>
          gen.map(rnd => acc.concat(rnd), gen0)
        )
      , gen.return([]))
    ]
  },
  objectOf: value => {
    const [typeKey, meta] = value.type;
    const gens = typeMap[typeKey](meta, value);

    return [
      _.reduce(gens, (acc0, gen0) =>
        gen.bind(acc0, acc =>
          gen.bind(gen0, rnd =>
            gen.map(
              key => _.extend({}, acc, { [key]: rnd }),
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

  shape: meta => genExaustive(meta),

  instanceOf: Component => {
    const meta = getMeta(Component.propTypes);
    const permutations = genExaustive(meta);

    return permutations.map(perm =>
      gen.map(props => <Component {...props} />, perm)
    );
  }
};

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

export function genExaustive(meta) {
  return getPermuatations(meta).map(obj => gen.object(obj));
}
