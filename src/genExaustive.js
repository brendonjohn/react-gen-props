import React from 'react';
import _ from 'lodash';
import {gen} from 'testcheck';
import faker from 'faker';
import {getMeta} from './meta';
import {genExtra} from './genExtra';

const typeMap = {
  bool: (_undefined, data) => {
    if (data.isExaustive) {
      return [gen.return(true), gen.return(false)];
    } else {
      return [gen.boolean];
    }
  },
  number: () => [gen.int],
  string: (_undefined, data) => {
    if (_.isString(data.exampleTemplate)) {
      return [gen.map(() => faker.fake(data.exampleTemplate), gen.null)];
    } else {
      return [gen.alphaNumString];
    }
  },
  any: () => [gen.any],
  element: () => [genExtra.element],
  node: () => [genExtra.node],
  func: () => [genExtra.func],
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
    ];
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

  oneOf: (arr, data) => {
    if (data.isExaustive) {
      return arr.map(a => gen.return(a));
    } else {
      return [gen.returnOneOf(arr)];
    }
  },

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

function handleRequired(gens, data) {
  if (data.isRequired && data.isExaustive) {
    return gens;
  }
  else if (data.isRequired) {
    return [_.sample(gens)];
  }
  else {
    return gens.concat(gen.undefined);
  }
}

function getPermutations(meta0) {
  // acc : [{ key -> gen }] where each object is complete (all fields present)
  // [field1, field2, field3]
  // 1. [{field1 -> gen}]
  // 2. [{field1 -> gen, field2 -> gen}, {field1 -> gen, field2 -> gen}]
  return _.reduce(meta0, (acc, value, key) => {
    const [typeKey, meta] = value.type;
    const gens = typeMap[typeKey](meta, value);

    const objs = _.map(
      handleRequired(gens, value),
      g => ({ [key]: g })
    );

    return _.reduce(acc, (acc0, item) => {
      const list = _.reduce(objs, (acc1, obj) => {
        return acc1.concat(_.extend({}, item, obj));
      }, []);

      return acc0.concat(list);
    }, []);

  }, [{}]);
}

export function genExaustive(meta) {
  return getPermutations(meta).map(obj => gen.object(obj));
}
