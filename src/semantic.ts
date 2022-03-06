import { close, open } from "fs";
import * as vscode from "vscode";
import * as Enum from "./enums";

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

export const legend = (function () {
  const tokenTypesLegend = [
    "annotation",
    // Standard (comment unused)
    "namespace", // For identifiers that declare or reference a namespace, module, or package.
    // "class", // For identifiers that declare or reference a class type.
    "enum", // For identifiers that declare or reference an enumeration type.
    "interface", // For identifiers that declare or reference an interface type.
    "struct", // For identifiers that declare or reference a struct type.
    "typeParameter", // For identifiers that declare or reference a type parameter.
    "type", // For identifiers that declare or reference a type that is not covered above.
    "parameter", // For identifiers that declare or reference a function or method parameters.
    // "variable", // For identifiers that declare or reference a local or global variable.
    "property", // For identifiers that declare or reference a member property, member field, or member variable.
    "enumMember", // For identifiers that declare or reference an enumeration property, constant, or member.
    // "decorator", // For identifiers that declare or reference decorators and annotations.
    "event", // For identifiers that declare an event property.
    // "function", // For identifiers that declare a function.
    // "method", // For identifiers that declare a member function or method.
    // "macro", // For identifiers that declare a macro.
    // "label", // For identifiers that declare a label.
    "comment", // For tokens that represent a comment.
    "string", // For tokens that represent a string literal.
    "keyword", // For tokens that represent a language keyword.
    "number", // For tokens that represent a number literal.
    // "regexp", // For tokens that represent a regular expression literal.
    "operator", // For tokens that represent an operator.
  ];
  tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

  const tokenModifiersLegend = [
    // Custom
    // Standard (comment unused)
    "declaration", // For declarations of symbols.
    "definition", // For definitions of symbols, for example, in header files.
    "readonly", // For readonly variables and member fields (constants).
    "static", // For class members (static members).
    "deprecated", // For symbols that should no longer be used.
    "abstract", // For types and member functions that are abstract.
    "async", // For functions that are marked async.
    "modification", // For variable references where the variable is assigned to.
    "documentation", // For occurrences of symbols in documentation.
    "defaultLibrary", // For symbols that are part of the standard library.
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
    document: vscode.TextDocument,
    token: vscode.CancellationToken
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
    const t: IParsedToken[] = [];
    const m: string[] = [""];
    const lines = text.split(/\r\n|\r|\n/);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
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

        if (tokenType === "keyword" || tokenType === "type") {
          // certain keywords?
          m.push(line.substring(openIndex, closeIndex));
          // focus on individual strings "module" and what comes after
          // then storing the data into tokenModifiers 
        } else if (tokenType === "identifier") {
          m.forEach((str) => {
            // for all things pushed on stack
            if (Enum.Keywords[str as keyof typeof Enum.Keywords] !== undefined) {
              tokenType = Enum.Keywords[str as keyof typeof Enum.Keywords];
            } else if (Enum.Types[str as keyof typeof Enum.Types] !== undefined) {
              tokenType = Enum.Types[str as keyof typeof Enum.Types];
            }
            if (Object.keys(Enum.Keywords)) {
              tokenModifiers.push();
              // if something is a modifier, we need to push all the modifiers into tokenModifiers
              // passed to final push that we push token, saving them
              // tokenModifiers is a string[]
            }
          });
          tokenModifiers = m;
        }

        currentIndex = closeIndex;

        // Special token handling
        switch (tokenType) {
          case Enum.Symbols.BSLASH:
            //
            tokenType = "operator";
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
            tokenType = "string";
            break;
          case Enum.Symbols.TRIPLEQUOTE:
            // brute force method - feel free to optimize
            tokenType = "string";
            t.push({
              line: i,
              startCharacter: line.indexOf('"""'),
              length: line.length - line.indexOf('"""'),
              tokenType: tokenType,
              tokenModifiers: tokenModifiers,
            });
            // push every line until we find """
            // """
            // test """
            // """ asdfasdf
            for (let j = i + 1; j < lines.length; j++) {
              line = lines[j];
              // find '"""'
              if ((line.indexOf('"""') === 0 && line.length === 3) || line.indexOf('"""') + 3 === line.length) {
                openIndex = 0;
                closeIndex = line.length;
                i = j;
                break;
              } else if (line.indexOf('"""') > 0 && line.indexOf('"""') < line.length + 1) {
                let subStr = line.substring(0, line.indexOf('"""') + 3);
                openIndex = 0;
                closeIndex = subStr.length;
                i = j;
                break;
              } else {
                t.push({
                  line: j,
                  startCharacter: 0,
                  length: line.length,
                  tokenType: tokenType,
                  tokenModifiers: tokenModifiers,
                });
              }
            }
            break;
          // Tokenize remaining line for comments and annotations
          case "comment":
          case "annotation":
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
        return "comment";
      case Enum.Symbols.PREANNOTATION:
        return "annotation";
      case Enum.Symbols.POSTANNOTATION:
        return "annotation";
    }
    if (this._isEnumMember(text, Enum.Types)) return "type";
    if (this._isEnumMember(text, Enum.Keywords)) return "keyword";
    if (this._isEnumValue(text, Enum.Operators)) return "operator";
    if (this._isNumber(text)) return "number";
    if (this._isIdentifier(text)) return "identifier";
    return "";
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
