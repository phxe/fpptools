import * as vscode from "vscode";
import { SemanticTokens } from "./semanticTokens";
import { Diagnostics } from "./diagnostics";
import { Keywords, TokenType } from "./constants";

vscode.window.showInformationMessage("FPPTools Extension Active");

export function activate(context: vscode.ExtensionContext) {
  Diagnostics.createCollection();
  const tokenProvider = new SemanticTokens();

  context.subscriptions.push(
    vscode.commands.registerCommand("fpp.toggleSemantic", () => {
      if (vscode.workspace.getConfiguration().get("fpp.semantic", true)) {
        vscode.window.showInformationMessage("FPPTools: Semantic Tokens Disabled");
        vscode.workspace.getConfiguration().update("fpp.semantic", false, true);
        context.subscriptions.push(
          vscode.languages.registerDocumentSemanticTokensProvider(
            { language: "fpp" },
            tokenProvider,
            new vscode.SemanticTokensLegend([], []) // Hacky
          )
        );
      } else {
        vscode.window.showInformationMessage("FPPTools: Semantic Tokens Enabled");
        vscode.workspace.getConfiguration().update("fpp.semantic", true, true);
        context.subscriptions.push(
          vscode.languages.registerDocumentSemanticTokensProvider(
            { language: "fpp" },
            // { scheme: "file", language: "fpp" },
            tokenProvider,
            SemanticTokens.tokenLegend
          )
        );
      }
    })
  );

  if (vscode.workspace.getConfiguration().get("fpp.semantic", true)) {
    context.subscriptions.push(
      vscode.languages.registerDocumentSemanticTokensProvider(
        { language: "fpp" },
        // { scheme: "file", language: "fpp" },
        tokenProvider,
        SemanticTokens.tokenLegend
      )
    );
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("fpp.toggleAutocomplete", () => {
      if (vscode.workspace.getConfiguration().get("fpp.autocomplete", true)) {
        vscode.window.showInformationMessage("FPPTools: Autocomplete Disabled");
        vscode.workspace.getConfiguration().update("fpp.autocomplete", false, true);
        // Figure out how to Disable the autocomplete feature here:
        // context.subscriptions.push(
        //   vscode.languages.registerDocumentSemanticTokensProvider(
        //     { language: "fpp" },
        //     tokenProvider,
        //     new vscode.SemanticTokensLegend([], []) // Hacky
        //   )
        // );
      } else {
        vscode.window.showInformationMessage("FPPTools: Autocomplete Disabled");
        vscode.workspace.getConfiguration().update("fpp.autocomplete", true, true);
        // Figure out how to Enable the autocomplete feature here:
        // context.subscriptions.push(
        //   vscode.languages.registerDocumentSemanticTokensProvider(
        //     { language: "fpp" },
        //     // { scheme: "file", language: "fpp" },
        //     tokenProvider,
        //     SemanticTokens.tokenLegend
        //   )
        // );
      }
    })
  );
  
  if (vscode.workspace.getConfiguration().get("fpp.autocomplete", true)) {
    // context.subscriptions.push(
    //   vscode.languages.registerDocumentSemanticTokensProvider(
    //     { language: "fpp" },
    //     // { scheme: "file", language: "fpp" },
    //     tokenProvider,
    //     SemanticTokens.tokenLegend
    //   )
    // );
  }

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
