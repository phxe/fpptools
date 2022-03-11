/* eslint-disable @typescript-eslint/naming-convention */

export function isValue(str: string, e: any): boolean {
  return Object.values(e).includes(str as any as typeof e) ? true : false;
}

export function isMember(str: string, e: any): boolean {
  return e[str as keyof typeof e] !== undefined ? true : false;
}

// FPP Types
export const Types = {
  // Numeric types
  F32: "variable",
  F64: "variable",
  I16: "variable",
  I32: "variable",
  I64: "variable",
  I8: "variable",
  U16: "variable",
  U32: "variable",
  U64: "variable",
  U8: "variable",
  // Unique types
  constant: "variable",
  bool: "variable",
  string: "string",
} as const;

// FPP Operators
export const Operators = {
  RPAREN: ")",
  RBRACKET: "]",
  RBRACE: "}",
  LPAREN: "(",
  MULT: "*",
  PLUS: "+",
  COMMA: ",",
  MINUS: "-",
  RARROW: "->",
  DOT: ".",
  DIV: "/",
  COLON: ":",
  SEMICOLON: ";",
  EQUALS: "=",
  LBRACKET: "[",
  LBRACE: "{",
} as const;

// FPP Symbols
export const Symbols = {
  BSLASH: "\\",
  COMMENT: "#",
  PREANNOTATION: "@",
  POSTANNOTATION: "@<",
  QUOTE: '"',
  TQUOTE: '"""',
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

// Semantic Token Types
export const TokenType = {
  // Token
  nil: "",
  annotation: "annotation",
  component: "component",
  instance: "instance",
  port: "port",
  topology: "topology",
  namespace: "namespace",
  class: "class",
  enum: "enum",
  interface: "interface",
  struct: "struct",
  typeParameter: "typeParameter",
  type: "type",
  parameter: "parameter",
  variable: "variable",
  property: "property",
  enumMember: "enumMember",
  decorator: "decorator",
  event: "event",
  function: "function",
  method: "method",
  macro: "macro",
  label: "label",
  comment: "comment",
  string: "string",
  keyword: "keyword",
  number: "number",
  regexp: "regexp",
  operator: "operator",
  // Modifier
  component_kind: "component-kind",
  declaration: "declaration",
  definition: "definition",
  readonly: "readonly",
  static: "static",
  deprecated: "deprecated",
  abstract: "abstract",
  async: "async",
  modification: "modification",
  documentation: "documentation",
  defaultLibrary: "defaultLibrary",
} as const;

// FPP Tokens
export type KeywordTokens = typeof KeywordTokens[keyof typeof KeywordTokens];
export const KeywordTokens = {
  array: "array",
  component: "component",
  constant: "constant",
  instance: "instance",
  enum: "enum",
  module: "module",
  port: "port",
  struct: "struct",
  type: "type",
  topology: "topology",
} as const;

// FPP Token to Semantic Token Type
export type KeywordTokensMap = typeof KeywordTokensMap[keyof typeof KeywordTokensMap];
export const KeywordTokensMap = {
  array: TokenType.variable,
  component: TokenType.component,
  constant: TokenType.variable,
  instance: TokenType.instance,
  enum: TokenType.enum,
  module: TokenType.namespace,
  port: TokenType.port,
  struct: TokenType.struct,
  type: TokenType.type,
  topology: TokenType.topology,
};

// FPP Modifiers
export type KeywordModifiers = typeof KeywordModifiers[keyof typeof KeywordModifiers];
export const KeywordModifiers = {
  active: "active",
  passive: "passive",
  queued: "queued",
  constant: "constant",
} as const;

// FPP Modifier to Semantic Token Type
export const KeywordModifiersMap = {
  active: TokenType.component_kind,
  passive: TokenType.component_kind,
  queued: TokenType.component_kind,
  constant: TokenType.readonly,
} as const;

// All FPP Keywords
export const Keywords = {
  module: "namespace",
  component: "component",
  instance: "instance",
  port: "port",
  active: "component-kind",
  passive: "component-kind",
  queued: "component-kind",
  constant: "readonly",
  //
  activity: "",
  always: "",
  assert: "",
  async: "async",
  at: "peroperty",
  base: "parametr",
  block: "property",
  change: "",
  command: "type",
  connections: "event",
  cpu: "operator",
  default: "number",
  diagnostic: "type",
  drop: "type",
  event: "type",
  false: "keyword",
  fatal: "type",
  format: "string",
  get: "type",
  guarded: "type",
  health: "type",
  high: "type",
  id: "keyword",
  import: "definition",
  include: "definition",
  input: "",
  internal: "declaration",
  locate: "declaration",
  low: "type",
  match: "",
  on: "keyword",
  opcode: "keyword",
  orange: "property",
  output: "type",
  param: "",
  phase: "keyword",
  priority: "keyword",
  private: "keyword",
  queue: "keyword",
  recv: "type",
  red: "property",
  ref: "annotation",
  reg: "type",
  resp: "type",
  save: "keyword",
  serial: "type",
  set: "keyword",
  severity: "keyword",
  size: "keyword",
  stack: "keyword",
  sync: "type",
  telemetry: "keyword",
  text: "string",
  throttle: "keyword",
  time: "keyword",
  topology: "keyword",
  true: "keyword",
  update: "keyword",
  warning: "type",
  with: "keyword",
  yellow: "property",
} as const;
