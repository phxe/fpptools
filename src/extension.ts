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

  // fpp tools commands test: fpp filenames
  //    writes out the names of XML and C++ files generated from FPP source files
  //    input: list of files, either single file stdin or list of files specified on the command line
  //    output: list of file names
  //            print list to the console or save to a txt file?
  vscode.commands.registerCommand("fpptools.filenames", () => {
    vscode.window.showInformationMessage("F'' Tools: Writing File Names...");

    const options = {
      canSelectMany: true,
      canSelectFiles: true,
      canSelectFolders: false,
      filters: {
        'FPP': ['fpp']
      },
      defaultUri: vscode.Uri.file('C:\\')
    };

    // select a file or multiple files (folders set to false in options)
    vscode.window.showOpenDialog(options);

    // once file/s selected:
    //    1. parse each file, generate list of translation units
    //    2. walk AST and identify defs that cause XML or C++ files to be generated
    //    3. write out names of generated files (one per line)
    
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
