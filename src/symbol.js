export function symbol(type) {
  const Symbol = global.Symbol;

  if (typeof Symbol === 'function') {
    if (Symbol[type]) {
      return Symbol[type];
    } else {
      const result = Symbol(type);
      Symbol[type] = result;
      return result;
    }
  } else {
    return `@@${type}`;
  }
}

export const metaSymbol = symbol('__REACT_GEN_PROPS__');
