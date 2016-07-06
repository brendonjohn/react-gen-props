import assert from 'assert'
import {PropTypes, sample} from '../src'

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

})
