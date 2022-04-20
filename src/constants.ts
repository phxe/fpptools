/* eslint-disable @typescript-eslint/naming-convention */

export function isValue(str: string, e: any): boolean {
  return Object.values(e).includes(str as any as typeof e) ? true : false;
}

export function isMember(str: string, e: any): boolean {
  return e[str as keyof typeof e] !== undefined ? true : false;
}

export const eof = new Error("End of File");

// Semantic Token Types
export type TokenType = typeof TokenType[keyof typeof TokenType];
export const TokenType = {
  // Token
  NIL: "",
  ANNOTATION: "annotation",
  COMPONENT: "component",
  INSTANCE: "instance",
  PORT: "port",
  TOPOLOGY: "topology",
  SPECIFIER: "specifier",
  NAMESPACE: "namespace",
  CLASS: "class",
  ENUM: "enum",
  INTERFACE: "interface",
  STRUCT: "struct",
  TYPEPARAMETER: "typeParameter",
  TYPE: "type",
  PARAMETER: "parameter",
  VARIABLE: "variable",
  PROPERTY: "property",
  ENUMMEMBER: "enumMember",
  DECORATOR: "decorator",
  EVENT: "event",
  FUNCTION: "function",
  METHOD: "method",
  MACRO: "macro",
  LABEL: "label",
  COMMENT: "comment",
  STRING: "string",
  KEYWORD: "keyword",
  NUMBER: "number",
  REGEXP: "regexp",
  OPERATOR: "operator",
  // Modifier
  DECLARATION: "declaration",
  DEFINITION: "definition",
  READONLY: "readonly",
  STATIC: "static",
  DEPRECATED: "deprecated",
  ABSTRACT: "abstract",
  ASYNC: "async",
  MODIFICATION: "modification",
  DOCUMENTATION: "documentation",
  DEFAULTLIBRARY: "defaultLibrary",
} as const;

// FPP Types
export const Types = {
  // Numeric Types
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
  // Special Types
  constant: "variable",
  bool: "variable",
  string: "string",
} as const;

// FPP Operators
export type Operators = typeof Operators[keyof typeof Operators];
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
  EQ: "=",
  LBRACKET: "[",
  LBRACE: "{",
  BSLASH: "\\",
} as const;

// // FPP Newline Supression Operators
// export type SuppressionOperators = typeof SuppressionOperators[keyof typeof SuppressionOperators];
// export const SuppressionOperators = {
//   LPAREN: "(",
//   MULT: "*",
//   PLUS: "+",
//   COMMA: ",",
//   MINUS: "-",
//   RARROW: "->",
//   DIV: "/",
//   COLON: ":",
//   SEMICOLON: ";",
//   EQ: "=",
//   LBRACKET: "[",
//   LBRACE: "{",
//   BSLASH: "\\",
// } as const;

// FPP Symbols
export const Symbols = {
  COMMENT: "#",
  PREANNOTATION: "@",
  POSTANNOTATION: "@<",
  QUOTE: '"',
  TQUOTE: '"""',
} as const;

// FPP Token to Semantic Token Type
export type KeywordTokensMap = typeof KeywordTokensMap[keyof typeof KeywordTokensMap];
export const KeywordTokensMap = {
  ARRAY: TokenType.VARIABLE,
  COMPONENT: TokenType.COMPONENT,
  CONSTANT: TokenType.VARIABLE,
  INSTANCE: TokenType.INSTANCE,
  ENUM: TokenType.ENUM,
  ENUMMEMBER: TokenType.ENUMMEMBER,
  MODULE: TokenType.NAMESPACE,
  PORT: TokenType.PORT,
  STRUCT: TokenType.STRUCT,
  TYPE: TokenType.TYPE,
  TOPOLOGY: TokenType.TOPOLOGY,
  PARAM: TokenType.PARAMETER,
  SPECIFIER: TokenType.SPECIFIER,
};

// All FPP Keywords
export const Keywords = {
  F32: "F32",
  F64: "F64",
  I16: "I16",
  I32: "I32",
  I64: "I64",
  I8: "I8",
  U16: "U16",
  U32: "U32",
  U64: "U64",
  U8: "U8",
  active: "active",
  activity: "activity",
  always: "always",
  array: "array",
  assert: "assert",
  async: "async",
  at: "at",
  base: "base",
  block: "block",
  bool: "bool",
  change: "change",
  command: "command",
  component: "component",
  connections: "connections",
  constant: "constant",
  cpu: "cpu",
  default: "default",
  diagnostic: "diagnostic",
  drop: "drop",
  enum: "enum",
  event: "event",
  false: "false",
  fatal: "fatal",
  format: "format",
  get: "get",
  guarded: "guarded",
  health: "health",
  high: "high",
  id: "id",
  import: "import",
  include: "include",
  input: "input",
  instance: "instance",
  internal: "internal",
  locate: "locate",
  low: "low",
  match: "match",
  module: "module",
  on: "on",
  opcode: "opcode",
  orange: "orange",
  output: "output",
  param: "param",
  passive: "passive",
  phase: "phase",
  port: "port",
  priority: "priority",
  private: "private",
  queue: "queue",
  queued: "queued",
  recv: "recv",
  red: "red",
  ref: "ref",
  reg: "reg",
  resp: "resp",
  save: "save",
  serial: "serial",
  set: "set",
  severity: "severity",
  size: "size",
  stack: "stack",
  string: "string",
  struct: "struct",
  sync: "sync",
  telemetry: "telemetry",
  text: "text",
  throttle: "throttle",
  time: "time",
  topology: "topology",
  true: "true",
  type: "type",
  update: "update",
  warning: "warning",
  with: "with",
  yellow: "yellow",
} as const;
