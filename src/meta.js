import {symbol} from './symbol';
import mapValues from 'lodash/mapValues';
import isObject from 'lodash/isObject';

export const metaSymbol = symbol('__REACT_GEN_PROPS__');

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

export function setMeta(obj, val) {
  obj[metaSymbol] = val;
  return val;
}
