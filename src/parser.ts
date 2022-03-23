import * as vscode from "vscode";
import * as FPP from "./constants";
import { Scanner } from "./scanner";
import { Visitor } from "./visitor";

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();
export var tokens: Parser.ParsedToken[] = [];

export const legend = (function () {
  const tokenTypesLegend = [
    // Custom
    FPP.TokenType.NIL,
    FPP.TokenType.ANNOTATION,
    FPP.TokenType.COMPONENT,
    FPP.TokenType.INSTANCE,
    FPP.TokenType.PORT,
    FPP.TokenType.TOPOLOGY,
    // Standard (comment unused)
    FPP.TokenType.NAMESPACE, // For identifiers that declare or reference a namespace, module, or package.
    FPP.TokenType.CLASS, // For identifiers that declare or reference a class type.
    FPP.TokenType.ENUM, // For identifiers that declare or reference an enumeration type.
    FPP.TokenType.INTERFACE, // For identifiers that declare or reference an interface type.
    FPP.TokenType.STRUCT, // For identifiers that declare or reference a struct type.
    FPP.TokenType.TYPEPARAMETER, // For identifiers that declare or reference a type parameter.
    FPP.TokenType.TYPE, // For identifiers that declare or reference a type that is not covered above.
    FPP.TokenType.PARAMETER, // For identifiers that declare or reference a function or method parameters.
    FPP.TokenType.VARIABLE, // For identifiers that declare or reference a local or global variable.
    FPP.TokenType.PROPERTY, // For identifiers that declare or reference a member property, member field, or member variable.
    FPP.TokenType.ENUMMEMBER, // For identifiers that declare or reference an enumeration property, constant, or member.
    FPP.TokenType.DECORATOR, // For identifiers that declare or reference decorators and annotations.
    FPP.TokenType.EVENT, // For identifiers that declare an event property.
    FPP.TokenType.FUNCTION, // For identifiers that declare a function.
    FPP.TokenType.METHOD, // For identifiers that declare a member function or method.
    FPP.TokenType.MACRO, // For identifiers that declare a macro.
    FPP.TokenType.LABEL, // For identifiers that declare a label.
    FPP.TokenType.COMMENT, // For tokens that represent a comment.
    FPP.TokenType.STRING, // For tokens that represent a string literal.
    FPP.TokenType.KEYWORD, // For tokens that represent a language keyword.
    FPP.TokenType.NUMBER, // For tokens that represent a number literal.
    FPP.TokenType.REGEXP, // For tokens that represent a regular expression literal.
    FPP.TokenType.OPERATOR, // For tokens that represent an operator.
  ];
  tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

  const tokenModifiersLegend = [
    // Custom
    // Standard (comment unused)
    FPP.TokenType.DECLARATION, // For declarations of symbols.
    FPP.TokenType.DEFINITION, // For definitions of symbols, for example, in header files.
    FPP.TokenType.READONLY, // For readonly variables and member fields (constants).
    FPP.TokenType.STATIC, // For class members (static members).
    FPP.TokenType.DEPRECATED, // For symbols that should no longer be used.
    FPP.TokenType.ABSTRACT, // For types and member functions that are abstract.
    FPP.TokenType.ASYNC, // For functions that are marked async.
    FPP.TokenType.MODIFICATION, // For variable references where the variable is assigned to.
    FPP.TokenType.DOCUMENTATION, // For occurrences of symbols in documentation.
    FPP.TokenType.DEFAULTLIBRARY, // For symbols that are part of the standard library.
  ];
  tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

  return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.SemanticTokens {
    tokens = [];
    Scanner.scanDocument(document.getText());
    Visitor.visitDocument();
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
    switch (text) {
      case FPP.Symbols.TQUOTE:
        return FPP.Symbols.TQUOTE;
      case FPP.Symbols.QUOTE:
        return FPP.Symbols.QUOTE;
      case FPP.Symbols.COMMENT:
        return FPP.TokenType.COMMENT;
      case FPP.Symbols.PREANNOTATION:
        return FPP.TokenType.ANNOTATION;
      case FPP.Symbols.POSTANNOTATION:
        return FPP.TokenType.ANNOTATION;
      default:
        if (FPP.isMember(text, FPP.Types)) return FPP.TokenType.TYPE;
        if (FPP.isMember(text, FPP.Keywords)) return FPP.TokenType.KEYWORD;
        if (FPP.isValue(text, FPP.Operators)) return FPP.TokenType.OPERATOR;
        if (isNumber(text)) return FPP.TokenType.NUMBER;
        return FPP.TokenType.NIL;
    }
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
