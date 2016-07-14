import assert from 'assert';
import _ from "lodash";
import {PropTypes, sample, getMeta} from '../src';

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

    const result = sample(props, { maxSize: 100, times });

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

  it('adds meta properties for easily consumable documentation', () => {
    const coolMeta = {description: 'Whether someone is cool or something'};
    const ageMeta = {description: 'The aim of the game'};
    const shirtMeta = {description: 'The dimensions of your shirt', madeIn: 'China'};

    const props = {
      name: PropTypes.string,
      age: PropTypes.number.isRequired.meta(ageMeta),
      isCool: PropTypes.bool.meta(coolMeta),
      shirt: PropTypes.shape({
        color: PropTypes.oneOf(['red', 'blue', 'green']).isRequired,
        sleeveLength: PropTypes.number
      }).isRequired.meta(shirtMeta)
    };

    const type = getMeta(props);

    assert.deepEqual(type, {
      name: {
        type: 'string',
        required: false
      },
      age: {
        ...ageMeta,
        type: 'number',
        required: true
      },
      isCool: {
        ...coolMeta,
        type: 'boolean',
        required: false
      },
      shirt: {
        ...shirtMeta,
        type: ['shape', {
          color: {
            type: ['oneOf',
              ['red', 'blue', 'green']
            ],
            required: true
          },
          sleeveLength: {
            type: 'number',
            required: false
          }
        }],
        required: true
      }
    });
  });



  it("supports faker templates on string PropTypes", () => {

    const nameMeta = {
      exampleTemplate: "{{name.firstName}} {{name.lastName}}"
    };

    const props = {
      name: PropTypes.string.isRequired.meta(nameMeta),
      name2: PropTypes.string.meta(nameMeta).isRequired,
      name3: PropTypes.string.meta(nameMeta)
    };

    const result = sample(props, { maxSize: 1,
                                   times: 3 });

    const pairs = _.zip(_.initial(result),
                        _.tail(result));

    _.each(pairs, ([a, b]) => {
      assert.ok(a.name !== b.name, "name failed: " + [a.name, b.name]);
      assert.ok(a.name2 !== b.name2, "name2 failed: " + [a.name2, b.name2]);
      assert.ok(a.name3 === undefined ||
                b.name3 === undefined ||
                a.name3 !== b.name3, "name3 failed: " + [a.name3, b.name3]);
    });
  });

  it("doesn't support faker templates in any other PropType that is not string", () => {


    const nameMeta = {
      exampleTemplate: "{{name.firstName}} {{name.lastName}}"
    };

    assert.throws(() => PropTypes.number.isRequired.meta(nameMeta),
                  /exampleTemplate/);

  });

});
