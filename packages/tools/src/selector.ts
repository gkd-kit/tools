import {
  MultiplatformSelector,
  initDefaultTypeInfo,
  MismatchExpressionTypeException,
  MismatchOperatorTypeException,
  MismatchParamTypeException,
  UnknownIdentifierException,
  UnknownIdentifierMethodException,
  UnknownMemberException,
  UnknownMemberMethodException,
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
  // @ts-ignore
  updateWasmToMatches(mod.exports.toMatches);
  supportsMatches = true;
} catch {
  console.warn(
    'Failed to instantiate wasm module, please update to nodejs@22. more info see https://gkd.li/selector/#regex-multiplatform',
  );
}

const typeInfo = initDefaultTypeInfo();
typeInfo.nodeType.props = typeInfo.nodeType.props.filter(
  (p) => !p.name.startsWith('_'),
);
typeInfo.contextType.props = typeInfo.contextType.props.filter(
  (p) => !p.name.startsWith('_'),
);
let logged = false;

export const parseSelector = (source: string): MultiplatformSelector => {
  const ms = MultiplatformSelector.Companion.parse(source);
  const useMatches = ms.binaryExpressions.some(
    (exp) => exp.operator.value.key == '~=',
  );
  if (useMatches && !supportsMatches && !logged) {
    logged = true;
    console.warn(
      'Matches operator is incomplete, please update to nodejs@22. more info see https://gkd.li/selector/#regex-multiplatform',
    );
  }
  const error = ms.checkType(typeInfo.contextType);
  if (error != null) {
    if (error instanceof MismatchExpressionTypeException) {
      throw new Error('不匹配表达式类型:' + error.exception.stringify(), {
        cause: error,
      });
    }
    if (error instanceof MismatchOperatorTypeException) {
      throw new Error('不匹配操作符类型:' + error.exception.stringify(), {
        cause: error,
      });
    }
    if (error instanceof MismatchParamTypeException) {
      throw new Error('不匹配参数类型:' + error.call.stringify(), {
        cause: error,
      });
    }
    if (error instanceof UnknownIdentifierException) {
      throw new Error('未知属性:' + error.value.value, {
        cause: error,
      });
    }
    if (error instanceof UnknownIdentifierMethodException) {
      throw new Error('未知方法:' + error.value.value, {
        cause: error,
      });
    }
    if (error instanceof UnknownMemberException) {
      throw new Error('未知属性:' + error.value.property, {
        cause: error,
      });
    }
    if (error instanceof UnknownMemberMethodException) {
      throw new Error('未知方法:' + error.value.property, {
        cause: error,
      });
    }
    throw new Error('未知错误:' + error, { cause: error });
  }
  return ms;
};
