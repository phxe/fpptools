import * as vscode from "vscode";
import * as FPP from "./constants";
import { SemanticTokens } from "./semanticTokens";

// export const KeywordCompletionMap = {

//   ARRAY: TokenType.VARIABLE,
//   COMPONENT: TokenType.COMPONENT,
//   CONSTANT: TokenType.VARIABLE,
//   INSTANCE: TokenType.INSTANCE,
//   ENUM: TokenType.ENUM,
//   ENUMMEMBER: TokenType.ENUMMEMBER,
//   MODULE: TokenType.NAMESPACE,
//   PORT: TokenType.PORT,
//   STRUCT: TokenType.STRUCT,
//   STRUCTMEMBER: TokenType.VARIABLE,
//   TYPE: TokenType.TYPE,
//   TOPOLOGY: TokenType.TOPOLOGY,
//   PARAM: TokenType.PARAMETER,
//   SPECIFIER: TokenType.SPECIFIER,
// };

export class CompletionItems implements vscode.CompletionItemProvider {
  static keywordList: vscode.CompletionItem[] = [];
  static keywordCompletionMap = new Map<FPP.TokenType, vscode.CompletionItemKind>();

  constructor() {
    let k: keyof typeof FPP.Keywords;
    for (k in FPP.Keywords) {
      let completionItem = new vscode.CompletionItem(FPP.Keywords[k], vscode.CompletionItemKind.Keyword);
      completionItem.detail = "Keyword";
      // Add additional text edits for some keywords
      CompletionItems.keywordList.push(completionItem);
    }
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.VARIABLE, vscode.CompletionItemKind.Variable);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.COMPONENT, vscode.CompletionItemKind.Class);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.INSTANCE, vscode.CompletionItemKind.Class);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.ENUM, vscode.CompletionItemKind.Enum);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.ENUMMEMBER, vscode.CompletionItemKind.EnumMember);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.NAMESPACE, vscode.CompletionItemKind.Module);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.PORT, vscode.CompletionItemKind.Method);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.STRUCT, vscode.CompletionItemKind.Struct);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.TYPE, vscode.CompletionItemKind.TypeParameter);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.TOPOLOGY, vscode.CompletionItemKind.Class);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.PARAMETER, vscode.CompletionItemKind.Variable);
    CompletionItems.keywordCompletionMap.set(FPP.TokenType.SPECIFIER, vscode.CompletionItemKind.Function);
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    let list: vscode.CompletionItem[] = [];
    if (SemanticTokens.identifiers !== undefined) {
      if (context.triggerCharacter === FPP.Operators.DOT) {
        // Get qualifier
        let b = new vscode.Range(position.line, 0, position.line, position.character - 1);
        let c = document.getText(b);

        SemanticTokens.identifiers.forEach((t, str) => {
          if (t[0] !== "" && c.substring(c.length - t[0].length, c.length) === t[0]) {
            let completionItem = new vscode.CompletionItem(str, CompletionItems.keywordCompletionMap.get(t[1]));
            completionItem.detail = t[1];
            list.push(completionItem);
          }
        });
        return list;
      }
      SemanticTokens.identifiers.forEach((t, str) => {
        let completionItem = new vscode.CompletionItem(str, CompletionItems.keywordCompletionMap.get(t[1]));
        completionItem.detail = t[1];
        list.push(completionItem);
      });
    }
    return list.concat(CompletionItems.keywordList);
  }
}
