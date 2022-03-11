import * as FPP from "./constants";
import { Parser, tokens } from "./parser";

const identifiers = new Map<string, [FPP.TokenType, FPP.TokenType[]]>();

export module Visitor {
  export function visitTokens() {
    if (tokens.length === 0) {
      return;
    }
    let i = 0;
    while (i < tokens.length) {
      let a = tokens[i].text;
      // switch (tokens[i].tokenType) {
      //   // Ignore special tokens
      //   case FPP.Symbols.COMMENT:
      //   case FPP.Symbols.POSTANNOTATION:
      //   case FPP.Symbols.PREANNOTATION:
      //     i++;
      //     break;
      //   default:
      switch (tokens[i].text) {
        case FPP.KeywordTokens.array:
          i = visitArrayDef(i);
          break;
        case FPP.KeywordModifiers.active:
        case FPP.KeywordModifiers.passive:
        case FPP.KeywordModifiers.queued:
          i = visitComponentDef(i);
          break;
        case FPP.Types.constant:
          i = visitConstantDef(i);
          break;
        case FPP.KeywordTokens.instance:
          i = visitInstanceDef(i);
          break;
        case FPP.KeywordTokens.enum:
          i = visitEnumDef(i);
          break;
        case FPP.KeywordTokens.module:
          i = visitModuleDef(i);
          break;
        case FPP.KeywordTokens.port:
          i = visitPortDef(i);
          break;
        case FPP.KeywordTokens.struct:
          i = visitStructDef(i);
          break;
        case FPP.KeywordTokens.type:
          i = visitTypeDef(i);
          break;
        case FPP.KeywordTokens.topology:
          i = visitTopologyDef(i);
          break;

        default:
      }
      i++;
      // }
    }
  }
  // Visit generics
  function visitIdentifier(
    index: number,
    type: FPP.TokenType = FPP.TokenType.nil,
    modifiers: FPP.TokenType[] = []
  ): number {
    tokens[index].tokenType = type;
    tokens[index].tokenModifiers = modifiers;
    if (Parser.isIdentifier(tokens[index].text)) {
      if (identifiers.has(tokens[index].text)) {
        tokens[index].tokenType = identifiers.get(tokens[index].text)?.[0] as FPP.TokenType;
        tokens[index].tokenModifiers = identifiers.get(tokens[index].text)?.[1] as FPP.TokenType[];
      } else {
        delete modifiers[modifiers.findIndex((mod) => mod === FPP.TokenType.declaration)];
        identifiers.set(tokens[index].text, [type, modifiers]);
      }
    } else {
      // new vscode.Range(line, column, line, column + length);
      // Error
    }
    return index;
  }

  // Visit FPP specifics
  // type identifier
  function visitTypeDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    return visitIdentifier(++index, FPP.KeywordTokensMap.type, [
      FPP.TokenType.declaration,
      FPP.TokenType.abstract,
    ]);
  }
  // array identifier = [ expression ] type-name [ default expression ] [ format string-literal ]
  function visitArrayDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    visitIdentifier(++index, FPP.KeywordTokensMap.array, [FPP.TokenType.declaration]);
    // parse rest
    return index + 1;
  }
  // component-kind component identifier { component-member-sequence }
  function visitComponentDef(index: number): number {
    visitComponentKind(index);
    tokens[index].tokenType = FPP.TokenType.keyword;
    FPP.KeywordTokensMap.component;
    return index + 1;
  }
  function visitComponentKind(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    return index + 1;
  }
  // instance identifier : qual-ident base id expression [ at string-literal ] [ queue size expression ]
  // [ stack size expression ] [ priority expression ] [ cpu expression ] [ { init-specifier-sequence } ]
  function visitInstanceDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    FPP.KeywordTokensMap.instance;
    return index + 1;
  }
  // constant identifier = expression
  function visitConstantDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    FPP.Types.constant;
    return index + 1;
  }
  // FPP identifier [ : type-name ] { FPP-constant-sequence } [ default expression ]
  function visitEnumDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    FPP.KeywordTokensMap.enum;
    return index + 1;
  }
  // identifier [ = expression ]
  function visitEnumConstantDef(index: number): number {
    return index + 1;
  }
  // module identifier { module-member-sequence }
  function visitModuleDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    FPP.KeywordTokensMap.module;
    return index + 1;
  }
  // port identifier [ ( param-list ) ] [ -> type-name ]
  function visitPortDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    FPP.KeywordTokensMap.port;
    return index + 1;
  }
  // struct identifier { struct-type-member-sequence } [ default expression ]
  function visitStructDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    FPP.KeywordTokensMap.struct;
    return index + 1;
  }
  // topology identifier { topology-member-sequence }
  function visitTopologyDef(index: number): number {
    tokens[index].tokenType = FPP.TokenType.keyword;
    FPP.KeywordTokensMap.topology;
    return index + 1;
  }
}
