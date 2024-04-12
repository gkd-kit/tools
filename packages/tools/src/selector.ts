import { MultiplatformSelector } from '@gkd-kit/selector';

export const parseSelector = (source: string): MultiplatformSelector => {
  const ms = MultiplatformSelector.Companion.parse(source);
  for (const { 0: name, 2: type } of ms.binaryExpressions) {
    if (!allowPropertyNames.includes(name)) {
      throw new Error(`Unknown property name ${name}`);
    }
    if (
      type != PrimitiveValue.NullValue.type &&
      allowPropertyTypes[name] != type
    ) {
      throw new Error(`Invalid property ${name} type ${type}`);
    }
  }
  return ms;
};

const PrimitiveValue = {
  StringValue: { type: 'string' },
  IntValue: { type: 'int' },
  BooleanValue: { type: 'boolean' },
  NullValue: { type: 'null' },
};

const allowPropertyTypes: Record<string, string> = /* #__PURE__ */ (() => ({
  id: PrimitiveValue.StringValue.type,
  vid: PrimitiveValue.StringValue.type,

  name: PrimitiveValue.StringValue.type,
  text: PrimitiveValue.StringValue.type,
  'text.length': PrimitiveValue.IntValue.type,
  desc: PrimitiveValue.StringValue.type,
  'desc.length': PrimitiveValue.IntValue.type,

  clickable: PrimitiveValue.BooleanValue.type,
  focusable: PrimitiveValue.BooleanValue.type,
  checkable: PrimitiveValue.BooleanValue.type,
  checked: PrimitiveValue.BooleanValue.type,
  editable: PrimitiveValue.BooleanValue.type,
  longClickable: PrimitiveValue.BooleanValue.type,
  visibleToUser: PrimitiveValue.BooleanValue.type,

  left: PrimitiveValue.IntValue.type,
  top: PrimitiveValue.IntValue.type,
  right: PrimitiveValue.IntValue.type,
  bottom: PrimitiveValue.IntValue.type,
  width: PrimitiveValue.IntValue.type,
  height: PrimitiveValue.IntValue.type,

  index: PrimitiveValue.IntValue.type,
  depth: PrimitiveValue.IntValue.type,
  childCount: PrimitiveValue.IntValue.type,
}))();

const allowPropertyNames = /* #__PURE__ */ (() => {
  return Object.keys(allowPropertyTypes);
})();
