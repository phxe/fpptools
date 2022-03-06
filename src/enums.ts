/* eslint-disable @typescript-eslint/naming-convention */
export enum Operators {
  RPAREN = ")",
  RBRACKET = "]",
  RBRACE = "}",
  LPAREN = "(",
  STAR = "*",
  PLUS = "+",
  COMMA = ",",
  MINUS = "-",
  RARROW = "->",
  DOT = ".",
  SLASH = "/",
  COLON = ":",
  SEMI = ";",
  EQUALS = "=",
  LBRACKET = "[",
  LBRACE = "{",
}

export enum Symbols {
  BSLASH = "\\",
  COMMENT = "#",
  PREANNOTATION = "@",
  POSTANNOTATION = "@<",
  QUOTE = '"',
  TRIPLEQUOTE = '"""',
}

// export class Keywords{

// }

export enum Modifiers {}

export enum Types {
  // Numeric types
  F32 = "number",
  F64 = "number",
  I16 = "number",
  I32 = "number",
  I64 = "number",
  I8 = "number",
  U16 = "number",
  U32 = "number",
  U64 = "number",
  U8 = "number",
  // Unique types
  bool = "",
  array = "",
  string = "string",
  struct = "struct",
  enum = "enum",
  // Abstract type
  type = "type",
}

export enum Keywords {
  active = "",
  activity = "",
  always = "",
  assert = "",
  async = "async",
  at = "peroperty",
  base = "parametr",
  block = "property",
  change = "",
  command = "type",
  component = "function",
  connections = "event",
  constant = "readonly",
  cpu = "operator",
  default = "number",
  diagnostic = "type",
  drop = "type",
  event = "",
  false = "",
  fatal = "type",
  format = "string",
  get = "",
  guarded = "type",
  health = "type",
  high = "type",
  id = "",
  import = "definition",
  include = "definition",
  input = "",
  instance = "declaration",
  internal = "declaration",
  locate = "declaration",
  low = "type",
  match = "",
  module = "namespace",
  on = "",
  opcode = "",
  orange = "",
  output = "",
  param = "",
  passive = "",
  phase = "",
  port = "",
  priority = "",
  private = "",
  queue = "",
  queued = "",
  recv = "",
  red = "",
  ref = "",
  reg = "",
  resp = "",
  save = "",
  serial = "",
  set = "",
  severity = "",
  size = "",
  stack = "",
  sync = "",
  telemetry = "",
  text = "",
  throttle = "",
  time = "",
  topology = "",
  true = "",
  update = "",
  warning = "type",
  with = "",
  yellow = "",
}
