import * as vscode from "vscode";
import * as FPP from "./constants";
import { SemanticTokens } from "./semanticTokens";

export class CompletionItems implements vscode.CompletionItemProvider {
  static keywordList: vscode.CompletionItem[] = [];

  constructor() {
    let k: keyof typeof FPP.Keywords;
    for (k in FPP.Keywords) {
      let completionItem = new vscode.CompletionItem(FPP.Keywords[k], vscode.CompletionItemKind.Keyword);
      completionItem.detail = "Keyword";
      // Add additional text edits for some keywords
      CompletionItems.keywordList.push(completionItem);
    }
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
            let completionItem = new vscode.CompletionItem(str, vscode.CompletionItemKind.Variable);
            completionItem.detail = t[1];
            list.push(completionItem);
          }
        });
        return list;
      }
      SemanticTokens.identifiers.forEach((t, str) => {
        let completionItem = new vscode.CompletionItem(str, vscode.CompletionItemKind.Variable);
        completionItem.detail = t[1];
        list.push(completionItem);
      });
    }
    return list.concat(CompletionItems.keywordList);
  }
}
