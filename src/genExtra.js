import React from 'react';
import {gen} from 'testcheck';
import htmlTags from 'html-tags';

const element = gen.map(
  React.createElement,
  gen.returnOneOf(htmlTags)
);

const node = gen.oneOf([
  gen.string,
  gen.int,
  element
]);

export const genExtra = {
  element,
  node
};
