import * as vscode from "vscode";
import * as FPP from "./constants";
import { SemanticTokens } from "./semanticTokens";
import { CompletionItems } from "./completionProvider";
import { Diagnostics } from "./diagnostics";

vscode.window.showInformationMessage("FPPTools Extension Active");

export function activate(context: vscode.ExtensionContext) {
  const fpp = vscode.languages;
  const editor = vscode.workspace;
  const tokenProvider = new SemanticTokens();
  const completionProvider = new CompletionItems();
  let disposableCompletionProvider = fpp.registerCompletionItemProvider({ language: "fpp" }, completionProvider, FPP.Operators.DOT);
  context.subscriptions.push(fpp.registerDocumentSemanticTokensProvider({ language: "fpp" }, tokenProvider, SemanticTokens.tokenLegend));
  if (editor.getConfiguration().get("fpp.autocomplete", true)) {
    context.subscriptions.push(disposableCompletionProvider);
  }
  // User Configuration Settings
  context.subscriptions.push(
    vscode.commands.registerCommand("fpp.toggleSemantic", () => {
      if (editor.getConfiguration().get("fpp.semantic", true)) {
        vscode.window.showInformationMessage("FPPTools: Semantic Tokens Disabled");
        editor.getConfiguration().update("fpp.semantic", false, true);
      } else {
        vscode.window.showInformationMessage("FPPTools: Semantic Tokens Enabled");
        editor.getConfiguration().update("fpp.semantic", true, true);
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("fpp.toggleAutocomplete", () => {
      if (vscode.workspace.getConfiguration().get("fpp.autocomplete", true)) {
        vscode.window.showInformationMessage("FPPTools: Code Completion Disabled");
        vscode.workspace.getConfiguration().update("fpp.autocomplete", false, true);
        disposableCompletionProvider.dispose();
      } else {
        vscode.window.showInformationMessage("FPPTools: Code Completion Enabled");
        vscode.workspace.getConfiguration().update("fpp.autocomplete", true, true);
        disposableCompletionProvider = fpp.registerCompletionItemProvider({ language: "fpp" }, completionProvider, FPP.Operators.DOT);
        context.subscriptions.push(disposableCompletionProvider);
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("fpp.toggleDiagnostics", () => {
      if (vscode.workspace.getConfiguration().get("fpp.diagnostics", true)) {
        vscode.window.showInformationMessage("FPPTools: Code Diagnostics Disabled");
        vscode.workspace.getConfiguration().update("fpp.diagnostics", false, true);
        Diagnostics.collection.dispose();
      } else {
        vscode.window.showInformationMessage("FPPTools: Code Diagnostics Enabled");
        vscode.workspace.getConfiguration().update("fpp.diagnostics", true, true);
        Diagnostics.collection = vscode.languages.createDiagnosticCollection();
      }
    })
  );
}

export function deactivate() {}
