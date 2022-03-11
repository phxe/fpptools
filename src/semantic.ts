import * as vscode from "vscode";
import * as Enum from "./enums";

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

export const legend = (function () {
  const tokenTypesLegend = [
    // Custom
    "annotation",
    // Standard (comment unused)
    "namespace", // For identifiers that declare or reference a namespace, module, or package.
    "enum", // For identifiers that declare or reference an enumeration type.
    "interface", // For identifiers that declare or reference an interface type.
    "struct", // For identifiers that declare or reference a struct type.
    "typeParameter", // For identifiers that declare or reference a type parameter.
    "type", // For identifiers that declare or reference a type that is not covered above.
    "parameter", // For identifiers that declare or reference a function or method parameters.
    "variable", // For identifiers that declare or reference a local or global variable.
    "property", // For identifiers that declare or reference a member property, member field, or member variable.
    "enumMember", // For identifiers that declare or reference an enumeration property, constant, or member.
    "decorator", // For identifiers that declare or reference decorators and annotations.
    "event", // For identifiers that declare an event property.
    "function", // For identifiers that declare a function.
    "method", // For identifiers that declare a member function or method.
    "macro", // For identifiers that declare a macro.
    "label", // For identifiers that declare a label.
    "comment", // For tokens that represent a comment.
    "string", // For tokens that represent a string literal.
    "keyword", // For tokens that represent a language keyword.
    "number", // For tokens that represent a number literal.
    "regexp", // For tokens that represent a regular expression literal.
    "operator", // For tokens that represent an operator.
  ];
  tokenTypesLegend.forEach((tokenType, index) =>
    tokenTypes.set(tokenType, index)
  );

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
  tokenModifiersLegend.forEach((tokenModifier, index) =>
    tokenModifiers.set(tokenModifier, index)
  );

  return new vscode.SemanticTokensLegend(
    tokenTypesLegend,
    tokenModifiersLegend
  );
})();

interface IParsedToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: string;
  tokenModifiers: string[];
}

export class DocumentSemanticTokensProvider
  implements vscode.DocumentSemanticTokensProvider
{
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

  private _isBreakpoint(char: string): boolean {
    if (char === " ") {
      return true;
    }
    if (this._isEnumValue(char, Enum.Operators)) {
      return true;
    }
    return false;
  }

  private _isEnumValue(str: string, e: any): boolean {
    for (let i in e) {
      if (str === e[i as keyof typeof e]) {
        return true;
      }
    }
    return false;
  }

  private _isEnumMember(str: string, e: any): boolean {
    for (let i in e) {
      if (str === e[i]) {
        return true;
      }
    }
    return false;
  }

  // private _isKeyword(str: string): boolean {
  //   for (let i in Keywords) {
  //     if (str === Keywords[i]) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }
  // private _isType(str: string): boolean {
  //   for (let i in Types) {
  //     if (str === Types[i]) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  // Add line continuations
  private _parseText(text: string): IParsedToken[] {
    const r: IParsedToken[] = [];
    const lines = text.split(/\r\n|\r|\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let eol = lines[i].length;
      let currentIndex = -1;

      do {
        currentIndex++;
        // if (lines[i][currentIndex] === "#" || lines[i][currentIndex] === "@") {
        //   // Comment or annotation - Ignore rest of line
        //   break;
        // }
        let openIndex = currentIndex;
        while (
          !this._isBreakpoint(lines[i][currentIndex]) &&
          currentIndex < eol
        ) {
          currentIndex++;
        }
        // if (openIndex === currentIndex) {
        //   continue;
        // }
        let closeIndex = currentIndex;

        let tmp = [""];
        r.push({
          line: i,
          startCharacter: openIndex,
          length: closeIndex - openIndex + 1,
          tokenType: this._parseTextToken(
            line.substring(openIndex, closeIndex)
          ),
          tokenModifiers: tmp,
        });
      } while (currentIndex < eol);
    }
    return r;
  }

  private _parseTextToken(text: string): string {
    if (this._isEnumMember(text, Enum.Keywords)) {
      return "keyword";
    }
    if (this._isEnumMember(text, Enum.Types)) {
      return "type";
    }
    if (this._isEnumMember(text, Enum.Operators)) {
      return "operator";
    }

    return "identifier";
  }
}
