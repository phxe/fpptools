import * as vscode from "vscode";
import * as FPP from "./constants";
import { Diagnostics } from "./diagnostics";
import { Scanner } from "./scanner";
import { Visitor } from "./visitor";

export class SemanticTokens implements vscode.DocumentSemanticTokensProvider {
  static tokenTypeMap: Map<string, number>;
  static tokenModifierMap: Map<string, number>;
  static tokenLegend: vscode.SemanticTokensLegend;
  static identifiers: Map<string, [string, FPP.TokenType, FPP.ModifierType[]]>;

  constructor() {
    SemanticTokens.tokenTypeMap = new Map<string, number>();
    SemanticTokens.tokenModifierMap = new Map<string, number>();
    const tokenTypesLegend: string[] = [];
    let k: keyof typeof FPP.TokenType;
    let i: number = 0;
    for (k in FPP.TokenType) {
      tokenTypesLegend.push(FPP.TokenType[k]);
      SemanticTokens.tokenTypeMap.set(FPP.TokenType[k], i++);
    }
    const tokenModifiersLegend: string[] = [];
    let j: keyof typeof FPP.ModifierType;
    i = 0;
    for (j in FPP.ModifierType) {
      tokenModifiersLegend.push(FPP.ModifierType[j]);
      SemanticTokens.tokenModifierMap.set(FPP.ModifierType[j], i++);
    }
    SemanticTokens.tokenLegend = new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
  }

  provideDocumentSemanticTokens(document: vscode.TextDocument, cancelToken: vscode.CancellationToken): vscode.SemanticTokens {
    Diagnostics.clear(document);
    const visitor: Visitor = new Visitor(Scanner.scanDocument(document.getText()));
    try {
      visitor.visitDocument();
    } catch (e) {
      console.log("Exception: " + e);
    }
    const builder = new vscode.SemanticTokensBuilder();
    if (vscode.workspace.getConfiguration().get("fpp.semantic", false)) {
      visitor.semanticTokens.forEach((token) => {
        builder.push(
          token.line,
          token.startCharacter,
          token.length,
          SemanticTokens.encodeTokenType(token.tokenType),
          SemanticTokens.encodeTokenModifiers(token.tokenModifiers)
        );
      });
      SemanticTokens.identifiers = visitor.identifiers;
      return builder.build();
    } else {
      return undefined!;
    }
  }

  private static encodeTokenType(tokenType: string): number {
    if (SemanticTokens.tokenTypeMap.has(tokenType)) {
      return SemanticTokens.tokenTypeMap.get(tokenType)!;
    }
    return 0;
  }

  private static encodeTokenModifiers(strTokenModifiers: string[]): number {
    let result = 0;
    for (let i = 0; i < strTokenModifiers.length; i++) {
      const tokenModifier = strTokenModifiers[i];
      if (SemanticTokens.tokenModifierMap.has(tokenModifier)) {
        result = result | (1 << SemanticTokens.tokenModifierMap.get(tokenModifier)!);
      }
    }
    return result;
  }
}
