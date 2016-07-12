import assert from 'assert'
import {PropTypes, sample, getMeta} from '../src'

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
    }

    const times = 100

    const result = sample(props, { maxSize: 100, times })

    assert.equal(result.length, times)

    result.forEach(obj => {
      assert.deepEqual(Object.keys(obj), ['name', 'age', 'isCool', 'shirt'])
      assert.deepEqual(Object.keys(obj.shirt), ['color', 'sleeveLength'])
      assert.ok(typeof obj.name === 'string')
      assert.ok(typeof obj.age === 'number')
      assert.ok(typeof obj.isCool === 'boolean' || typeof obj.isCool === 'undefined')
      assert.ok(typeof obj.shirt.color === 'string')
      assert.ok(typeof obj.shirt.sleeveLength === 'number')
    })
  })

  it('adds meta properties for easily consumable documentation', () => {
    const coolMeta = {description: 'Whether someone is cool or something'}
    const ageMeta = {description: 'The aim of the game'}
    const shirtMeta = {description: 'The dimensions of your shirt', madeIn: 'China'}

    const props = {
      name: PropTypes.string,
      age: PropTypes.number.isRequired.meta(ageMeta),
      isCool: PropTypes.bool.meta(coolMeta),
      shirt: PropTypes.shape({
        color: PropTypes.oneOf(['red', 'blue', 'green']).isRequired,
        sleeveLength: PropTypes.number
      }).isRequired.meta(shirtMeta)
    }

    const type = getMeta(props)

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
    })
  })
})
