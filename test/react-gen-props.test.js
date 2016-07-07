import assert from 'assert'
import {PropTypes, sample, metaSymbol} from '../src'

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
      assert.ok(typeof obj.shirt.color === 'string')
      assert.ok(typeof obj.shirt.sleeveLength === 'number')
    })
  })

  it('adds meta properties to the properties', () => {
    const nameMeta = {description: 'The name of the person'}
    const ageMeta = {description: 'The age of the person'}

    const props = {
      name: PropTypes.string.isRequired.meta(nameMeta),
      age: PropTypes.number.meta(ageMeta).isRequired
    }

    assert.equal(props.name[metaSymbol], nameMeta)
    assert.equal(props.age[metaSymbol], ageMeta)
  })

})
