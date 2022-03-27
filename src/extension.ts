import * as vscode from "vscode";
import { DocumentSemanticTokensProvider, legend } from "./parser";

vscode.window.showInformationMessage("F`` Extension Active");

export function activate(context: vscode.ExtensionContext) {
  vscode.commands.registerCommand("fpp.example", () => {
    vscode.window.showInformationMessage("Example launched!");
  });

  //fpptools commands test
  vscode.commands.registerCommand("fpptools.check", () => {
    vscode.window.showInformationMessage("F`` Tools: Check Semantics Tool Test...");
    // Could either have the user select a file using showOpenDialog,
    // Try forcing '.fpp' files, or select multiple? entire folder?
    vscode.window.showOpenDialog();

    // or use the current file in the editor
  });

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { scheme: "file", language: "fpp" },
      new DocumentSemanticTokensProvider(),
      legend
    )
  );

	const statementIdentifier = vscode.languages.registerCompletionItemProvider(
		'plaintext',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {

				// get all text until the `position` and check if it reads `console.`
				// and if so then complete if `log`, `warn`, and `error`
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (!linePrefix.endsWith('console.')) {
					return undefined;
				}

				return [
					new vscode.CompletionItem('log', vscode.CompletionItemKind.Method),
					new vscode.CompletionItem('warn', vscode.CompletionItemKind.Method),
					new vscode.CompletionItem('error', vscode.CompletionItemKind.Method),
				];
			}
		},
		'.' // triggered whenever a '.' is being typed
	);

	// using subscriptions since it ensures the command is properly de-registered when extension is unloaded
	context.subscriptions.push(statementIdentifier);
}

export function deactivate() {}
