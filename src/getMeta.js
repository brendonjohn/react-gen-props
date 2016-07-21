import {metaSymbol} from './symbol';
import mapValues from 'lodash/mapValues';
import isObject from 'lodash/isObject';

export function getMeta(obj) {
  if (obj[metaSymbol]) {
    return obj[metaSymbol];
  }

  if (isObject(obj)) {
    obj[metaSymbol] = mapValues(obj, fn => fn[metaSymbol]);
    return obj[metaSymbol];
  }

  throw new Error('wat?');
}
