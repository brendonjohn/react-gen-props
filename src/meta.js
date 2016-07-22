import {symbol} from './symbol';
import mapValues from 'lodash/mapValues';
import isObject from 'lodash/isObject';

export const metaSymbol = symbol('__SUPER_SECRET_REACT_GEN_PROPS_META_SYMBOL__');

export function getMeta(obj) {
  if (obj[metaSymbol]) {
    return obj[metaSymbol];
  }

  if (isObject(obj)) {
    obj[metaSymbol] = mapValues(obj, getMeta);
    return obj[metaSymbol];
  }

  throw new Error('wat?');
}

export function setMeta(obj, val) {
  obj[metaSymbol] = val;
  return val;
}
