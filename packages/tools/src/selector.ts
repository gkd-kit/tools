import {
  initDefaultTypeInfo,
  Selector,
  updateWasmToMatches,
} from '@gkd-kit/selector';
import matchesInstantiate from '@gkd-kit/wasm_matches';
import fs from 'node:fs/promises';
import url from 'node:url';

let supportsMatches = false;
const wasmUrl = import.meta.resolve('@gkd-kit/wasm_matches/dist/mod.wasm');
const buffer = await fs.readFile(url.fileURLToPath(wasmUrl));
try {
  const mod = await matchesInstantiate(buffer);
  updateWasmToMatches(
    mod.exports.toMatches as Parameters<typeof updateWasmToMatches>[0],
  );
  supportsMatches = true;
} catch {
  console.warn(
    'Failed to instantiate wasm module, please update to nodejs@22. more info see https://gkd.li/selector/#regex-multiplatform',
  );
}

const typeInfo = initDefaultTypeInfo();
let logged = false;

export const parseSelector = (source: string): Selector => {
  const selector = Selector.Companion.parse(source);
  const useMatches = selector.expression.binaryExpressionList
    .asJsReadonlyArrayView()
    .some((exp) => exp.operator.key == '~=');
  if (useMatches && !supportsMatches && !logged) {
    logged = true;
    console.warn(
      'Matches operator is incomplete, please update to nodejs@22. more info see https://gkd.li/selector/#regex-multiplatform',
    );
  }
  selector.checkType(typeInfo.contextType);
  return selector;
};
