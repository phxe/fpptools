import { close, open } from "fs";
import * as vscode from "vscode";
import * as Enum from "./enums";

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

export const legend = (function () {
  const tokenTypesLegend = [
    Enum.Token.annotation,
    Enum.Token.component,
    Enum.Token.instance,
    // Standard (comment unused)
    Enum.Token.namespace, // For identifiers that declare or reference a namespace, module, or package.
    Enum.Token.class, // For identifiers that declare or reference a class type.
    Enum.Token.enum, // For identifiers that declare or reference an enumeration type.
    Enum.Token.interface, // For identifiers that declare or reference an interface type.
    Enum.Token.struct, // For identifiers that declare or reference a struct type.
    Enum.Token.typeParameter, // For identifiers that declare or reference a type parameter.
    Enum.Token.type, // For identifiers that declare or reference a type that is not covered above.
    Enum.Token.parameter, // For identifiers that declare or reference a function or method parameters.
    Enum.Token.variable, // For identifiers that declare or reference a local or global variable.
    Enum.Token.property, // For identifiers that declare or reference a member property, member field, or member variable.
    Enum.Token.enumMember, // For identifiers that declare or reference an enumeration property, constant, or member.
    Enum.Token.decorator, // For identifiers that declare or reference decorators and annotations.
    Enum.Token.event, // For identifiers that declare an event property.
    Enum.Token.function, // For identifiers that declare a function.
    Enum.Token.method, // For identifiers that declare a member function or method.
    Enum.Token.macro, // For identifiers that declare a macro.
    Enum.Token.label, // For identifiers that declare a label.
    Enum.Token.comment, // For tokens that represent a comment.
    Enum.Token.string, // For tokens that represent a string literal.
    Enum.Token.keyword, // For tokens that represent a language keyword.
    Enum.Token.number, // For tokens that represent a number literal.
    Enum.Token.regexp, // For tokens that represent a regular expression literal.
    Enum.Token.operator, // For tokens that represent an operator.
  ];
  tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

  const tokenModifiersLegend = [
    // Custom
    Enum.Token.component_kind,
    // Standard (comment unused)
    Enum.Token.declaration, // For declarations of symbols.
    Enum.Token.definition, // For definitions of symbols, for example, in header files.
    Enum.Token.readonly, // For readonly variables and member fields (constants).
    Enum.Token.static, // For class members (static members).
    Enum.Token.deprecated, // For symbols that should no longer be used.
    Enum.Token.abstract, // For types and member functions that are abstract.
    Enum.Token.async, // For functions that are marked async.
    Enum.Token.modification, // For variable references where the variable is assigned to.
    Enum.Token.documentation, // For occurrences of symbols in documentation.
    Enum.Token.defaultLibrary, // For symbols that are part of the standard library.
  ];
  tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

  return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

interface IParsedToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: string;
  tokenModifiers: string[];
}

export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  async provideDocumentSemanticTokens(
    document: vscode.TextDocument
    // token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    const allTokens = this._parseText(document.getText());
    const builder = new vscode.SemanticTokensBuilder();
    allTokens.forEach((token) => {
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
    } else if (tokenType === "notInLegend") {
      return tokenTypes.size + 2;
    }
    return 0;
  }

  private _encodeTokenModifiers(strTokenModifiers: string[]): number {
    let result = 0;
    for (let i = 0; i < strTokenModifiers.length; i++) {
      const tokenModifier = strTokenModifiers[i];
      if (tokenModifiers.has(tokenModifier)) {
        result = result | (1 << tokenModifiers.get(tokenModifier)!);
      } else if (tokenModifier === "notInLegend") {
        result = result | (1 << (tokenModifiers.size + 2));
      }
    }
    return result;
  }

  private _getCloseIndex(text: string, curr: number): number {
    while (!this._isBreakpoint(text[curr]) && curr < text.length) {
      curr++;
    }
    // Check float vs dot expression
    if (text[curr] === "." && this._isInteger(text[curr + 1])) {
      return this._getCloseIndex(text, curr + 1);
    }
    return curr;
  }

  // Add line continuations
  private _parseText(text: string): IParsedToken[] {
    const lines = text.split(/\r\n|\r|\n/);
    const t: IParsedToken[] = [];
    let m = [""];
    // let isContinuation = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let currentIndex = 0;

      // Scan line
      while (currentIndex < lines[i].length) {
        if (lines[i][currentIndex] === " ") {
          currentIndex++;
          continue;
        }

        // Scan token
        let openIndex = currentIndex;
        let closeIndex = this._getCloseIndex(lines[i], currentIndex);

        // Handle multi-character operators/symbols
        if (closeIndex === openIndex) {
          switch (lines[i][closeIndex] + lines[i][closeIndex + 1]) {
            case Enum.Symbols.POSTANNOTATION:
            case Enum.Operators.RARROW:
              closeIndex++;
            default:
              break;
          }
          if (lines[i].substring(closeIndex, closeIndex + 3) === Enum.Symbols.TRIPLEQUOTE) {
            closeIndex += 2;
          }
          closeIndex++;
        }

        let tokenType = this._parseTextToken(line.substring(openIndex, closeIndex));

        let tokenModifiers = [""];

        if (tokenType === Enum.Token.keyword || tokenType === Enum.Token.type) {
          // certain keywords?
          m.push(line.substring(openIndex, closeIndex));
        } else if (tokenType === "IDENTIFIER") {
          m.forEach((str) => {
            if (Enum.Types[str as keyof typeof Enum.Types] !== undefined) {
              tokenType = Enum.Types[str as keyof typeof Enum.Types];
            } else if (Enum.Keywords[str as keyof typeof Enum.Keywords] !== undefined) {
              tokenType = Enum.Keywords[str as keyof typeof Enum.Keywords];
              // if (Object.keys(Enum.Keywords)) {
              //   tokenModifiers.push();
            } else {
              currentIndex = closeIndex;
              tokenType = "UNKNOWN";
            }
          });
          m = [""];
          // tokenModifiers = m;
        }

        currentIndex = closeIndex;

        // Special token handling
        switch (tokenType) {
          case Enum.Symbols.BSLASH:
            // TODO
            tokenType = Enum.Token.operator;
            break;
          case Enum.Symbols.QUOTE:
            while (
              (lines[i][closeIndex] !== '"' && closeIndex < lines[i].length) ||
              (lines[i][closeIndex] === '"' &&
                lines[i][closeIndex - 1] === "\\" &&
                closeIndex < lines[i].length)
            ) {
              closeIndex++;
            }
            closeIndex++;
            currentIndex = closeIndex;
            tokenType = Enum.Token.string;
            break;
          case Enum.Symbols.TRIPLEQUOTE:
            // TODO
            tokenType = Enum.Token.string;
            break;
          // Tokenize remaining line for comments and annotations
          case Enum.Token.comment:
          case Enum.Token.annotation:
            t.push({
              line: i,
              startCharacter: closeIndex,
              length: lines[i].length - closeIndex,
              tokenType: tokenType,
              tokenModifiers: [],
            });
            currentIndex = lines[i].length;
            break;
        }

        t.push({
          line: i,
          startCharacter: openIndex,
          length: closeIndex - openIndex,
          tokenType: tokenType,
          tokenModifiers: tokenModifiers,
        });
      }
    }
    return t;
  }

  private _parseTextToken(text: string): string {
    /* eslint-disable curly */
    switch (text) {
      case Enum.Symbols.BSLASH:
        return Enum.Symbols.BSLASH;
      case Enum.Symbols.TRIPLEQUOTE:
        return Enum.Symbols.TRIPLEQUOTE;
      case Enum.Symbols.QUOTE:
        return Enum.Symbols.QUOTE;
      case Enum.Symbols.COMMENT:
        return Enum.Token.comment;
      case Enum.Symbols.PREANNOTATION:
        return Enum.Token.annotation;
      case Enum.Symbols.POSTANNOTATION:
        return Enum.Token.annotation;
    }
    if (this._isEnumMember(text, Enum.Types)) return Enum.Token.type;
    if (this._isEnumMember(text, Enum.Keywords)) return Enum.Token.keyword;
    if (this._isEnumValue(text, Enum.Operators)) return Enum.Token.operator;
    if (this._isNumber(text)) return Enum.Token.number;
    if (this._isIdentifier(text)) return "IDENTIFIER";
    return "UNKNOWN";
  }

  private _isIdentifier(str: string): boolean {
    if (str[0] === "$" && str[1] !== "$")
      return this._isIdentifier(str.substring(1, str.length - 2));
    if (!(this._isAlpha(str[0]) || str[0] === "_")) return false;
    for (var i = 0; i < str?.length; i++) {
      if (!(this._isAlpha(str[i]) || this._isInteger(str[i]) || str[i] === "_")) return false;
    }
    return true;
  }

  private _isAlpha(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (str[i].toLowerCase() < "a" || str[i].toLowerCase() > "z") return false;
    }
    return true;
  }

  private _isNumber(str: string): boolean {
    if (str[0] === "-" && str[1] !== "-") return this._isNumber(str.substring(1, str.length));
    if (str[0] + str[1]?.toLowerCase() === "0x") return this._isHex(str.substring(2, str.length));
    if (str.includes(".")) return this._isFloat(str);
    return this._isInteger(str);
  }

  private _isHex(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (!((str[i].toLowerCase() > "a" && str[i].toLowerCase() < "f") || this._isInteger(str[i])))
        return false;
    }
    return true;
  }

  private _isFloat(str: string): boolean {
    return (
      this._isInteger(str.substring(0, str.indexOf("."))) &&
      this._isInteger(str.substring(str.indexOf(".") + 1, str.length))
    );
  }

  private _isInteger(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (str[i] < "0" || str[i] > "9") return false;
    }
    return true;
  }

  private _isBreakpoint(char: string): boolean {
    if (char === " ") {
      return true;
    }
    if (this._isEnumValue(char, Enum.Symbols)) {
      return true;
    }
    if (this._isEnumValue(char, Enum.Operators)) {
      return true;
    }
    return false;
  }

  private _isEnumValue(str: string, e: any): boolean {
    if (Object.values(e).includes(str as any as typeof e)) {
      return true;
    }
    return false;
  }

  private _isEnumMember(str: string, e: any): boolean {
    if (e[str as keyof typeof e] !== undefined) {
      return true;
    }
    return false;
  }
}
