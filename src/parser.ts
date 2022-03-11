import * as vscode from "vscode";
import * as FPP from "./constants";
import { Scanner } from "./scanner";
import { Visitor } from "./visitor";

export var tokens: Parser.ParsedToken[] = [];

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

export const legend = (function () {
  const tokenTypesLegend = [
    // Custom
    FPP.TokenType.nil,
    FPP.TokenType.annotation,
    FPP.TokenType.component,
    FPP.TokenType.instance,
    FPP.TokenType.port,
    FPP.TokenType.topology,
    // Standard (comment unused)
    FPP.TokenType.namespace, // For identifiers that declare or reference a namespace, module, or package.
    FPP.TokenType.class, // For identifiers that declare or reference a class type.
    FPP.TokenType.enum, // For identifiers that declare or reference an enumeration type.
    FPP.TokenType.interface, // For identifiers that declare or reference an interface type.
    FPP.TokenType.struct, // For identifiers that declare or reference a struct type.
    FPP.TokenType.typeParameter, // For identifiers that declare or reference a type parameter.
    FPP.TokenType.type, // For identifiers that declare or reference a type that is not covered above.
    FPP.TokenType.parameter, // For identifiers that declare or reference a function or method parameters.
    FPP.TokenType.variable, // For identifiers that declare or reference a local or global variable.
    FPP.TokenType.property, // For identifiers that declare or reference a member property, member field, or member variable.
    FPP.TokenType.enumMember, // For identifiers that declare or reference an enumeration property, constant, or member.
    FPP.TokenType.decorator, // For identifiers that declare or reference decorators and annotations.
    FPP.TokenType.event, // For identifiers that declare an event property.
    FPP.TokenType.function, // For identifiers that declare a function.
    FPP.TokenType.method, // For identifiers that declare a member function or method.
    FPP.TokenType.macro, // For identifiers that declare a macro.
    FPP.TokenType.label, // For identifiers that declare a label.
    FPP.TokenType.comment, // For tokens that represent a comment.
    FPP.TokenType.string, // For tokens that represent a string literal.
    FPP.TokenType.keyword, // For tokens that represent a language keyword.
    FPP.TokenType.number, // For tokens that represent a number literal.
    FPP.TokenType.regexp, // For tokens that represent a regular expression literal.
    FPP.TokenType.operator, // For tokens that represent an operator.
  ];
  tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

  const tokenModifiersLegend = [
    // Custom
    FPP.TokenType.component_kind,
    // Standard (comment unused)
    FPP.TokenType.declaration, // For declarations of symbols.
    FPP.TokenType.definition, // For definitions of symbols, for example, in header files.
    FPP.TokenType.readonly, // For readonly variables and member fields (constants).
    FPP.TokenType.static, // For class members (static members).
    FPP.TokenType.deprecated, // For symbols that should no longer be used.
    FPP.TokenType.abstract, // For types and member functions that are abstract.
    FPP.TokenType.async, // For functions that are marked async.
    FPP.TokenType.modification, // For variable references where the variable is assigned to.
    FPP.TokenType.documentation, // For occurrences of symbols in documentation.
    FPP.TokenType.defaultLibrary, // For symbols that are part of the standard library.
  ];
  tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

  return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    tokens = Scanner.scanDocument(document.getText());
    Visitor.visitTokens();
    const builder = new vscode.SemanticTokensBuilder();
    tokens.forEach((token) => {
      builder.push(
        token.line,
        token.startCharacter,
        token.length,
        this._encodeTokenType(token.tokenType),
        this._encodeTokenModifiers(token.tokenModifiers)
      );
    });
    return builder.build();
  }

  private _encodeTokenType(tokenType: string): number {
    if (tokenTypes.has(tokenType)) {
      return tokenTypes.get(tokenType)!;
    }
    return 0;
  }

  private _encodeTokenModifiers(strTokenModifiers: string[]): number {
    let result = 0;
    for (let i = 0; i < strTokenModifiers.length; i++) {
      const tokenModifier = strTokenModifiers[i];
      if (tokenModifiers.has(tokenModifier)) {
        result = result | (1 << tokenModifiers.get(tokenModifier)!);
      }
    }
    return result;
  }
}

export module Parser {
  export interface ParsedToken {
    line: number;
    startCharacter: number;
    length: number;
    tokenType: string;
    text: string;
    tokenModifiers: string[];
  }

  export function parseTextToken(text: string): string {
    /* eslint-disable curly */
    if (FPP.isMember(text, FPP.Types)) return FPP.TokenType.type;
    if (FPP.isMember(text, FPP.Keywords)) return FPP.TokenType.keyword;
    if (FPP.isValue(text, FPP.Operators)) return FPP.TokenType.operator;

    if (isIdentifier(text)) return "IDENTIFIER";
    return "UNKNOWN";
  }

  export function isIdentifier(str: string): boolean {
    if (FPP.isMember(str, FPP.Keywords)) return false;
    if (str[0] === "$" && str[1] !== "$") return isIdentifier(str.substring(1, str.length - 2));
    if (!(isAlpha(str[0]) || str[0] === "_")) return false;
    for (var i = 0; i < str?.length; i++) {
      if (!(isAlpha(str[i]) || isInteger(str[i]) || str[i] === "_")) return false;
    }
    return true;
  }

  export function isAlpha(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (str[i].toLowerCase() < "a" || str[i].toLowerCase() > "z") return false;
    }
    return true;
  }

  export function isNumber(str: string): boolean {
    if (str[0] === "-" && str[1] !== "-") return isNumber(str.substring(1, str.length));
    if (str[0] + str[1]?.toLowerCase() === "0x") return isHex(str.substring(2, str.length));
    if (str.includes(".")) return isFloat(str);
    return isInteger(str);
  }

  export function isHex(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (!((str[i].toLowerCase() >= "a" && str[i].toLowerCase() <= "f") || isInteger(str[i])))
        return false;
    }
    return true;
  }

  export function isFloat(str: string): boolean {
    return (
      isInteger(str.substring(0, str.indexOf("."))) &&
      isInteger(str.substring(str.indexOf(".") + 1, str.length))
    );
  }

  export function isInteger(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (str[i] < "0" || str[i] > "9") return false;
    }
    return true;
  }
}
