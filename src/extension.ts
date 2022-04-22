import * as vscode from "vscode";
import { DocumentSemanticTokensProvider, legend, tokens } from "./parser";
import { Diagnostics } from "./diagnostics";
import { Keywords, TokenType } from "./constants";

vscode.window.showInformationMessage("FPPTools Extension Active");

export function activate(context: vscode.ExtensionContext) {
  Diagnostics.createCollection();
  vscode.commands.registerCommand("fpp.example", () => {
    vscode.window.showInformationMessage("Example launched!");
  });

  //fpptools commands test

  // fpp tools commands test: fpp check
  //    this command will perform semantic checking of FPP models using the fpp-check tool.
  //    input: a file or list of files
  //    output: If the check succeeds, then no standard output; otherwise an error message.
  vscode.commands.registerCommand("fpptools.check", () => {
    vscode.window.showInformationMessage(
      "FPP Tools: Check Semantics Tool Test..." //test message
    );

    // users will be able to select multiple files. Only .FPP files will appear.
    var fileOptions: vscode.OpenDialogOptions = {
      canSelectMany: true,
      filters: {
        "FPP Files": ["fpp", "fppi"],
      },
    };

    var selectionOptions: vscode.QuickPickOptions = {
      canPickMany: false,
      ignoreFocusOut: false,
      placeHolder: "Use current file in editor, or open new file(s)?",
    };

    const quickPickSelection: Array<vscode.QuickPickItem> = [
      {
        label: "Run on current file in editor",
        description: "Run fpp-check on current file in the editor",
      },
      {
        label: "Open new file(s)",
        description: "Run fpp-check on existing .fpp file(s)",
      },
    ];

    // if we have a current workspace folder, we will default to that. Otherwise,
    // open up the file explorer without a default filepath.
    if (vscode.workspace.workspaceFolders !== undefined) {
      let filepath = vscode.workspace.workspaceFolders[0].uri;
      fileOptions.defaultUri = filepath;
    }

    //choose from current file in editor or open a file:
    vscode.window.showQuickPick(quickPickSelection, selectionOptions).then((selection) => {
      if (selection?.label === "Run on current file in editor") {
        // TODO: get currently open file in editor
        vscode.window.showInformationMessage(
          "Selected File: " + vscode.window.activeTextEditor?.document.uri.fsPath
        );
      } else {
        // Open file explorer
        vscode.window.showOpenDialog(fileOptions).then((files) => {
          if (files) {
            for (var uri of files) {
              vscode.window.showInformationMessage("Selected File: " + uri.fsPath);
            }
          }
        });
      }
    });

    // TODO: once filepaths are obtained, files will be checked using the fpp-check tool in some way.
  });

  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { scheme: "file", language: "fpp" },
      new DocumentSemanticTokensProvider(),
      legend
    )
  );

  // context.subscriptions.push(
  //   vscode.languages.registerCompletionItemProvider(
  //     { scheme: "file", language: "fpp" },
  //     {
  //       provideCompletionItems(
  //         document: vscode.TextDocument,
  //         position: vscode.Position,
  //         token: vscode.CancellationToken,
  //         context: vscode.CompletionContext
  //       ) {
  //         let list: vscode.CompletionItem[] = [];
  //         let k: keyof typeof Keywords;
  //         for (k in Keywords) {
  //           list.push(new vscode.CompletionItem(Keywords[k]));
  //         }
  //         tokens.forEach((t) => {
  //           switch (t.tokenType) {
  //             case TokenType.COMPONENT:
  //             case TokenType.ANNOTATION:
  //             case TokenType.COMPONENT:
  //             case TokenType.INSTANCE:
  //             case TokenType.PORT:
  //             case TokenType.TOPOLOGY:
  //             case TokenType.SPECIFIER:
  //             case TokenType.NAMESPACE:
  //             case TokenType.ENUM:
  //             case TokenType.ENUMMEMBER:
  //               list.push(new vscode.CompletionItem(t.text));
  //               break;
  //             default:
  //           }
  //         });

  //         return list;
  //       },
  //     }
  //   )
  // );
}

export function deactivate() {}
