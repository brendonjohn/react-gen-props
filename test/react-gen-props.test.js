import assert from 'assert';
import _ from 'lodash';
import {PropTypes, getSample, getExaustive, getMeta} from '../src';

describe('PropTypes', () => {
  it('generates random properties', () => {
    const props = {
      name: PropTypes.string.isRequired,
      age: PropTypes.number.isRequired,
      isCool: PropTypes.bool,
      shirt: PropTypes.shape({
        color: PropTypes.oneOf(['red', 'blue', 'green']).isRequired,
        sleeveLength: PropTypes.number.isRequired
      }).isRequired
    };

    const times = 100;

    const result = getSample(props, { maxSize: 100, times });

    assert.equal(result.length, times);

    result.forEach(obj => {
      assert.deepEqual(Object.keys(obj), ['name', 'age', 'isCool', 'shirt']);
      assert.deepEqual(Object.keys(obj.shirt), ['color', 'sleeveLength']);
      assert.ok(typeof obj.name === 'string');
      assert.ok(typeof obj.age === 'number');
      assert.ok(typeof obj.isCool === 'boolean' || typeof obj.isCool === 'undefined');
      assert.ok(typeof obj.shirt.color === 'string');
      assert.ok(typeof obj.shirt.sleeveLength === 'number');
    });
  });

  it('generates a proper instance of a component', () => {
    function Component () {
      return <div />
    }

    Component.propTypes = {
      number: PropTypes.number.isRequired,
      string: PropTypes.string.isRequired,
      arrayOfBools: PropTypes.arrayOf(PropTypes.bool).isRequired
    }

    const props = {
      myComponent: PropTypes.instanceOf(Component).isRequired
    }

    const sample = getSample(props, { times: 1 });

    assert.ok(typeof sample[0].myComponent.props.number === 'number')
    assert.ok(typeof sample[0].myComponent.props.string === 'string')
    assert.ok(Array.isArray(sample[0].myComponent.props.arrayOfBools))
  });

  it('adds meta properties for easily consumable documentation', () => {
    const coolMeta = {description: 'Whether someone is cool or something'};
    const ageMeta = {description: 'The aim of the game'};
    const shirtMeta = {description: 'The dimensions of your shirt', madeIn: 'China'};

    const props = {
      name: PropTypes.string,
      age: PropTypes.number.meta(ageMeta).isRequired,
      isCool: PropTypes.bool.meta(coolMeta),
      shirt: PropTypes.shape({
        color: PropTypes.oneOf(['red', 'blue', 'green']).isRequired,
        sleeveLength: PropTypes.number
      }).isRequired.meta(shirtMeta)
    };

    const type = getMeta(props);

    assert.deepEqual(type, {
      name: {
        type: ['string'],
        isRequired: false
      },
      age: {
        ...ageMeta,
        type: ['number'],
        isRequired: true
      },
      isCool: {
        ...coolMeta,
        type: ['boolean'],
        isRequired: false
      },
      shirt: {
        ...shirtMeta,
        type: ['shape', {
          color: {
            type: ['oneOf',
              ['red', 'blue', 'green']
            ],
            isRequired: true
          },
          sleeveLength: {
            type: ['number'],
            isRequired: false
          }
        }],
        isRequired: true
      }
    });
  });

  it('supports faker templates on string PropTypes', () => {

    const nameMeta = {
      exampleTemplate: '{{name.firstName}} {{name.lastName}}'
    };

    const props = {
      name: PropTypes.string.isRequired.meta(nameMeta),
      name2: PropTypes.string.meta(nameMeta).isRequired,
      name3: PropTypes.string.meta(nameMeta)
    };

    const result = getSample(props, { maxSize: 1,
                                   times: 3 });

    const pairs = _.zip(_.initial(result),
                        _.tail(result));

    _.each(pairs, ([a, b]) => {
      assert.ok(a.name !== b.name, 'name failed: ' + [a.name, b.name]);
      assert.ok(a.name2 !== b.name2, 'name2 failed: ' + [a.name2, b.name2]);
      assert.ok(a.name3 === undefined ||
                b.name3 === undefined ||
                a.name3 !== b.name3, 'name3 failed: ' + [a.name3, b.name3]);
    });
  });

  describe('generating exaustive lists', () => {
    it('generates exaustive lists of booleans', () => {
      const props = {
        a: PropTypes.bool.isRequired,
        b: PropTypes.bool.isRequired,
      };

      const result = getExaustive(props);

      assert.deepEqual(result, [
          { a: true, b: true },
          { a: true, b: false },
          { a: false, b: true },
          { a: false, b: false }
        ]);
    });

    it('generates exaustive lists of oneOf', () => {
      const props = {
        a: PropTypes.bool.isRequired,
        b: PropTypes.bool.isRequired,
        c: PropTypes.oneOf(['a', 'b', 'c']).isRequired
      };

      const result = getExaustive(props);

      assert.deepEqual(result, [
          { a: true, b: true, c: 'a' },
          { a: true, b: true, c: 'b' },
          { a: true, b: true, c: 'c' },
          { a: true, b: false, c: 'a' },
          { a: true, b: false, c: 'b' },
          { a: true, b: false, c: 'c' },
          { a: false, b: true, c: 'a' },
          { a: false, b: true, c: 'b' },
          { a: false, b: true, c: 'c' },
          { a: false, b: false, c: 'a' },
          { a: false, b: false, c: 'b' },
          { a: false, b: false, c: 'c' }
        ]);
    });

    it('generates exaustive lists for shape', () => {
      const props = {
        a: PropTypes.shape({
          b: PropTypes.bool.isRequired,
          c: PropTypes.oneOf(['d', 'e', 'f']).isRequired
        }).isRequired,
        g: PropTypes.bool.isRequired
      };

      const result = getExaustive(props);

      assert.deepEqual(result, [
        { a: { b: true, c: 'd' }, g: true },
        { a: { b: true, c: 'd' }, g: false },
        { a: { b: true, c: 'e' }, g: true },
        { a: { b: true, c: 'e' }, g: false },
        { a: { b: true, c: 'f' }, g: true },
        { a: { b: true, c: 'f' }, g: false },
        { a: { b: false, c: 'd' }, g: true },
        { a: { b: false, c: 'd' }, g: false },
        { a: { b: false, c: 'e' }, g: true },
        { a: { b: false, c: 'e' }, g: false },
        { a: { b: false, c: 'f' }, g: true },
        { a: { b: false, c: 'f' }, g: false }
      ]);
    });

    it('generates exaustive lists for arrayOf by including all possibilities in a single array', () => {
      const props = {
        a: PropTypes.arrayOf(PropTypes.bool).isRequired,
        b: PropTypes.arrayOf(PropTypes.bool).isRequired
      };

      const result = getExaustive(props);

      assert.ok(result.length, 1);
      assert.ok(result[0].a.indexOf(true) > -1);
      assert.ok(result[0].a.indexOf(false) > -1);
      assert.ok(result[0].b.indexOf(true) > -1);
      assert.ok(result[0].b.indexOf(false) > -1);
    });

    it('generates exaustive lists for oneOfType by combining all generators for all different types', () => {
      const props = {
        a: PropTypes.oneOfType([
          PropTypes.bool,
          PropTypes.oneOf(['b', 'c'])
        ]),
        d: PropTypes.bool.isRequired
      };

      const result = getExaustive(props);

      assert.deepEqual(result, [
        { a: true, d: true },
        { a: true, d: false },
        { a: false, d: true },
        { a: false, d: false },
        { a: 'b', d: true },
        { a: 'b', d: false },
        { a: 'c', d: true },
        { a: 'c', d: false },
        { a: undefined, d: true },
        { a: undefined, d: false }
      ]);
    });

    it('generates exaustive object for objectOf', () => {
      const props = {
        a: PropTypes.objectOf(
          PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.oneOf(['b', 'c', 'd'])
          ]))
      };

      const result = getExaustive(props);
      const values = _.values(result[0].a);

      assert.equal(result.length, 2);
      assert.equal(values.length, 5);
      assert.ok(values.indexOf(true) > -1);
      assert.ok(values.indexOf(false) > -1);
      assert.ok(values.indexOf('b') > -1);
      assert.ok(values.indexOf('c') > -1);
      assert.ok(values.indexOf('d') > -1);
      assert.equal(result[1].a, undefined);
    });

    it('generates an exaustive list of component instances', () => {
      function Component () {
        return <div />
      }

      Component.propTypes = {
        b: PropTypes.bool.isRequired,
        c: PropTypes.oneOf(['d', 'e']).isRequired
      }

      const props = {
        a: PropTypes.instanceOf(Component).isRequired
      };

      const result = getExaustive(props);

      assert.equal(result.length, 4);

      result.forEach(perm => {
        assert.ok([true, false].indexOf(perm.a.props.b) > -1)
        assert.ok(['d', 'e'].indexOf(perm.a.props.c) > -1)
      })
    });

    it('generates undefined values for props that are not required', () => {
      const props = {
        a: PropTypes.bool,
        b: PropTypes.bool,
        c: PropTypes.bool.isRequired,
      };

      const result = getExaustive(props);

      assert.deepEqual(result, [
          { a: true, b: true, c: true },
          { a: true, b: true, c: false },
          { a: true, b: false, c: true },
          { a: true, b: false, c: false },
          { a: true, b: undefined, c: true },
          { a: true, b: undefined, c: false },
          { a: false, b: true, c: true },
          { a: false, b: true, c: false },
          { a: false, b: false, c: true },
          { a: false, b: false, c: false },
          { a: false, b: undefined, c: true },
          { a: false, b: undefined, c: false },
          { a: undefined, b: true, c: true },
          { a: undefined, b: true, c: false },
          { a: undefined, b: false, c: true },
          { a: undefined, b: false, c: false },
          { a: undefined, b: undefined, c: true },
          { a: undefined, b: undefined, c: false }
        ]);
    });

    it('does not regard open props in exaustive lists', () => {
      const props = {
        a: PropTypes.bool.isRequired,
        b: PropTypes.string.isRequired
      };

      const result = getExaustive(props);

      assert.equal(result.length, 2);
    });

    it('still uses templates', () => {
      const props = {
        a: PropTypes.bool.isRequired,
        b: PropTypes.string.meta({exampleTemplate: 'HELLO!'}).isRequired
      };

      const result = getExaustive(props);

      assert.equal(result.length, 2);
      assert.equal(result[0].b, 'HELLO!');
      assert.equal(result[1].b, 'HELLO!');
    })
  });
});
