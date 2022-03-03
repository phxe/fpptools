import * as vscode from "vscode";
import { DocumentSemanticTokensProvider, legend } from "./semantic";

vscode.window.showInformationMessage("F`` Extension Active");

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerCommand("fpp.example", () => {
    vscode.window.showInformationMessage("Example launched!");
  });

  //fpptools commands test
  vscode.commands.registerCommand("fpptools.check", () => {
    vscode.window.showInformationMessage(
      "F`` Tools: Check Semantics Tool Test..."
    );
    // Could either have the user select a file using showOpenDialog,
    // Try forcing '.fpp' files, or select multiple? entire folder?
    vscode.window.showOpenDialog();

    // or use the current file in the editor
  });

  // context.subscriptions.push(
  //   vscode.languages.registerDocumentSemanticTokensProvider(
  //     { language: "fpp" },
  //     new DocumentSemanticTokensProvider(),
  //     legend
  //   )
  // );
}

export function deactivate() {}
