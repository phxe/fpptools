import * as vscode from "vscode";
import { DocumentSemanticTokensProvider, legend } from "./semantic";

vscode.window.showInformationMessage("F`` Extension Active");

export function activate(context: vscode.ExtensionContext) {
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
      "F`` Tools: Check Semantics Tool Test..."
    );

    // users will be able to select multiple files. Only .FPP files will appear.
    var options: vscode.OpenDialogOptions = {
      canSelectMany: true,
      filters: {
        'FPP Files': ['fpp']
      }
    }
    // if we have a current workspace folder, we will default to that. Otherwise,
    // open up the file explorer without a default filepath.
    if(vscode.workspace.workspaceFolders !== undefined) {
      let filepath = vscode.workspace.workspaceFolders[0].uri
      options.defaultUri = filepath
    }
    vscode.window.showOpenDialog(options).then(files => {
      if (files){
        for (var uri of files) {
          vscode.window.showInformationMessage(
            "Selected File: " + uri.fsPath
          )
        }
      }
    })
    // TODO: once filepaths are obtained, files will be checked using the fpp-check tool in some way.
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
    vscode.window.showOpenDialog(options).then(fileUri => {
      if (fileUri && fileUri.length > 0) {
        // show info message stating the file count
        vscode.window.showInformationMessage("You have selected " + fileUri.length + " file/s.");

        // print file name of each selected file
        for (var f = 0; f < fileUri.length; f++) {
          let filepath: string = fileUri[f].fsPath;
          let filename: string = filepath.replace(/^.*[\\\/]/, '');

          // show file name as an info message
          //vscode.window.showInformationMessage("File " + (f+1) + ": " + filename);

          // print file name to the debug console
          console.log("File " + (f+1) + ": " + filename);

        }
      }
    })

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
