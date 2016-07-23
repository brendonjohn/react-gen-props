import testcheck from 'testcheck';

import {genExaustive} from './genExaustive';
import {genSample} from './genSample';
import {getMeta} from './meta';

export {PropTypes} from './PropTypes';
export {getMeta};

export function getExaustive(propTypes) {
  const meta = getMeta(propTypes);
  const exhaustiveGens = genExaustive(meta);
  return exhaustiveGens.map(g => testcheck.sample(g, {times: 1})[0]);
}

export function getSample(propTypes, opts) {
  const { maxSize = 10, times = 20 } = opts;
  const meta = getMeta(propTypes);
  const sampleGen = genSample(meta);
  return testcheck.sample(sampleGen, {maxSize, times});
}
