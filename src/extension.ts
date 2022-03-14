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
      "F`` Tools: Check Semantics Tool Test..." //test message
    );

    // users will be able to select multiple files. Only .FPP files will appear.
    var fileOptions: vscode.OpenDialogOptions = {
      canSelectMany: true,
      filters: {
        'FPP Files': ['fpp', 'fppi']
      }
    };

    var selectionOptions: vscode.QuickPickOptions = {
      canPickMany: false,
      ignoreFocusOut: false,
      placeHolder: "Use current file in editor, or open new file(s)?",
    };

    const quickPickSelection: Array<vscode.QuickPickItem> = [
      {
        label: "Run on current file in editor",
        description: "Run fpp-check on current file in the editor"
      },
      {
        label: "Open new file(s)",
        description: "Run fpp-check on existing .fpp file(s)"
      }
    ];
  
    // if we have a current workspace folder, we will default to that. Otherwise,
    // open up the file explorer without a default filepath.
    if(vscode.workspace.workspaceFolders !== undefined) {
      let filepath = vscode.workspace.workspaceFolders[0].uri;
      fileOptions.defaultUri = filepath;
    }

    //choose from current file in editor or open a file:
    vscode.window.showQuickPick(quickPickSelection, selectionOptions).then(selection => {
      if (selection.label === "Run on current file in editor") {
        // TODO: get currently open file in editor
        vscode.window.showInformationMessage("Selected File: " + vscode.window.activeTextEditor?.document.uri.fsPath);
      } else {
        // Open file explorer
        vscode.window.showOpenDialog(fileOptions).then(files => {
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
        'FPP': ['fpp', 'fppi']
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
    });

    // once file/s selected:
    //    1. parse each file, generate list of translation units
    //    2. walk AST and identify defs that cause XML or C++ files to be generated
    //    3. write out names of generated files (one per line)
    
  });

  // fpp tools commands test: fpp syntax
  //    this command will parse FPP source files into an abstract syntax tree (AST) using the fpp-syntax tool
  //    input: a file or list of files
  //    output: If the parse succeeds, then no standard output; otherwise an error message.
  //    extras: Optional text representation of the AST
  vscode.commands.registerCommand("fpptools.syntax", () => {
    vscode.window.showInformationMessage("F`` Tools: Parse FPP to AST");  //debug message
    
    var options: vscode.OpenDialogOptions = {
      canSelectMany: true,
      filters: {
        'FPP Files': ['fpp', 'fppi']
      }
    };

    vscode.window.showOpenDialog(options).then(files => {
      if (files){
        for (var uri of files) {
          vscode.window.showInformationMessage(
            "Selected File: " + uri.fsPath
          );
        }
      }
    });



  });

  // fpp tools commands test: fpp from xml
  // this command will perform converting of F Prime XML files to FPP files.
  //    input: A list of XML files to translate, specified as a list of files on the command line
  //    output: FPP source, written to standard output
  //    Procedure: 
  //    1 Read each of the files in the list
  //    2 Generate the output for each F Prime model element in the list
  vscode.commands.registerCommand("fpptools.fromxml", () => {
    vscode.window.showInformationMessage("F'' Tools: fpp from XML");
    // For now, will do just one selected file.
    var options: vscode.OpenDialogOptions = {
      filters: {
        'FPP Files': ['fpp', 'fppi']
      },
    };

    vscode.window.showOpenDialog(options).then(files => {
      if (files) {
        for (var uri of files) {
          vscode.window.showInformationMessage(
            "Selected File: " + uri.fsPath
          );
        }
      }
    });

    //TODO: Generate the output for the F Prime model element that was selected
  });

  // context.subscriptions.push(
  //   vscode.languages.registerDocumentSemanticTokensProvider(
  //     { language: "fpp" },
  //     new DocumentSemanticTokensProvider(),
  //     legend
  //   )
  // );
  

  // code completion
  
  const keywordProvider = vscode.languages.registerCompletionItemProvider('plaintext', 
  {
    //keyword code completion
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionList>
    {
      // active
      const activeCompletion = new vscode.CompletionItem('active');
      activeCompletion.kind = vscode.CompletionItemKind.Keyword;
      activeCompletion.insertText = 'active';
      activeCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // activity
      const activityCompletion = new vscode.CompletionItem('activity');
      activityCompletion.kind = vscode.CompletionItemKind.Keyword;
      activityCompletion.insertText = 'activity';
      activityCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // always
      const alwaysCompletion = new vscode.CompletionItem('always');
      alwaysCompletion.kind = vscode.CompletionItemKind.Keyword;
      alwaysCompletion.insertText = 'always';
      alwaysCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // assert
      const assertCompletion = new vscode.CompletionItem('assert');
      assertCompletion.kind = vscode.CompletionItemKind.Keyword;
      assertCompletion.insertText = 'assert';
      assertCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // async
      const asyncCompletion = new vscode.CompletionItem('async');
      asyncCompletion.kind = vscode.CompletionItemKind.Keyword;
      asyncCompletion.insertText = 'async';
      asyncCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // at
      const atCompletion = new vscode.CompletionItem('at');
      atCompletion.kind = vscode.CompletionItemKind.Keyword;
      atCompletion.insertText = 'at';
      atCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // base
      const baseCompletion = new vscode.CompletionItem('base');
      baseCompletion.kind = vscode.CompletionItemKind.Keyword;
      baseCompletion.insertText = 'base';
      baseCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // block
      const blockCompletion = new vscode.CompletionItem('block');
      blockCompletion.kind = vscode.CompletionItemKind.Keyword;
      blockCompletion.insertText = 'block';
      blockCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // change
      const changeCompletion = new vscode.CompletionItem('change');
      changeCompletion.kind = vscode.CompletionItemKind.Keyword;
      changeCompletion.insertText = 'change';
      changeCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // command
      const commandCompletion = new vscode.CompletionItem('command');
      commandCompletion.kind = vscode.CompletionItemKind.Keyword;
      commandCompletion.insertText = 'command';
      commandCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // component
      const componentCompletion = new vscode.CompletionItem('component');
      componentCompletion.kind = vscode.CompletionItemKind.Keyword;
      componentCompletion.insertText = 'component';
      componentCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // connections
      const connectionsCompletion = new vscode.CompletionItem('connections');
      connectionsCompletion.kind = vscode.CompletionItemKind.Keyword;
      connectionsCompletion.insertText = 'connections';
      connectionsCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // constant
      const constantCompletion = new vscode.CompletionItem('constant');
      constantCompletion.kind = vscode.CompletionItemKind.Keyword;
      constantCompletion.insertText = 'constant';
      constantCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // cpu
      const cpuCompletion = new vscode.CompletionItem('cpu');
      cpuCompletion.kind = vscode.CompletionItemKind.Keyword;
      cpuCompletion.insertText = 'cpu';
      cpuCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // default
      const defaultCompletion = new vscode.CompletionItem('default');
      defaultCompletion.kind = vscode.CompletionItemKind.Keyword;
      defaultCompletion.insertText = 'default';
      defaultCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // diagnostic
      const diagnosticCompletion = new vscode.CompletionItem('diagnostic');
      diagnosticCompletion.kind = vscode.CompletionItemKind.Keyword;
      diagnosticCompletion.insertText = 'diagnostic';
      diagnosticCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // drop
      const dropCompletion = new vscode.CompletionItem('drop');
      dropCompletion.kind = vscode.CompletionItemKind.Keyword;
      dropCompletion.insertText = 'drop';
      dropCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // event
      const eventCompletion = new vscode.CompletionItem('event');
      eventCompletion.kind = vscode.CompletionItemKind.Keyword;
      eventCompletion.insertText = 'event';
      eventCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // false
      const falseCompletion = new vscode.CompletionItem('false');
      falseCompletion.kind = vscode.CompletionItemKind.Keyword;
      falseCompletion.insertText = 'false';
      falseCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // fatal
      const fatalCompletion = new vscode.CompletionItem('fatal');
      fatalCompletion.kind = vscode.CompletionItemKind.Keyword;
      fatalCompletion.insertText = 'fatal';
      fatalCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // format
      const formatCompletion = new vscode.CompletionItem('format');
      formatCompletion.kind = vscode.CompletionItemKind.Keyword;
      formatCompletion.insertText = 'format';
      formatCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // get
      const getCompletion = new vscode.CompletionItem('get');
      getCompletion.kind = vscode.CompletionItemKind.Keyword;
      getCompletion.insertText = 'get';
      getCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // guarded
      const guardedCompletion = new vscode.CompletionItem('guarded');
      guardedCompletion.kind = vscode.CompletionItemKind.Keyword;
      guardedCompletion.insertText = 'guarded';
      guardedCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // health
      const healthCompletion = new vscode.CompletionItem('health');
      healthCompletion.kind = vscode.CompletionItemKind.Keyword;
      healthCompletion.insertText = 'health';
      healthCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // high
      const highCompletion = new vscode.CompletionItem('high');
      highCompletion.kind = vscode.CompletionItemKind.Keyword;
      highCompletion.insertText = 'high';
      highCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // id
      const idCompletion = new vscode.CompletionItem('id');
      idCompletion.kind = vscode.CompletionItemKind.Keyword;
      idCompletion.insertText = 'id';
      idCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // import
      const importCompletion = new vscode.CompletionItem('import');
      importCompletion.kind = vscode.CompletionItemKind.Keyword;
      importCompletion.insertText = 'import';
      importCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // include
      const includeCompletion = new vscode.CompletionItem('include');
      includeCompletion.kind = vscode.CompletionItemKind.Keyword;
      includeCompletion.insertText = 'include';
      includeCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // input
      const inputCompletion = new vscode.CompletionItem('input');
      inputCompletion.kind = vscode.CompletionItemKind.Keyword;
      inputCompletion.insertText = 'input';
      inputCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // instance
      const instanceCompletion = new vscode.CompletionItem('instance');
      instanceCompletion.kind = vscode.CompletionItemKind.Keyword;
      instanceCompletion.insertText = 'instance';
      instanceCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // internal
      const internalCompletion = new vscode.CompletionItem('internal');
      internalCompletion.kind = vscode.CompletionItemKind.Keyword;
      internalCompletion.insertText = 'internal';
      internalCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // locate
      const locateCompletion = new vscode.CompletionItem('locate');
      locateCompletion.kind = vscode.CompletionItemKind.Keyword;
      locateCompletion.insertText = 'locate';
      locateCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // low
      const lowCompletion = new vscode.CompletionItem('low');
      lowCompletion.kind = vscode.CompletionItemKind.Keyword;
      lowCompletion.insertText = 'low';
      lowCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // match
      const matchCompletion = new vscode.CompletionItem('match');
      matchCompletion.kind = vscode.CompletionItemKind.Keyword;
      matchCompletion.insertText = 'match';
      matchCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // module
      const moduleCompletion = new vscode.CompletionItem('module');
      moduleCompletion.kind = vscode.CompletionItemKind.Keyword;
      moduleCompletion.insertText = 'module';
      moduleCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // on
      const onCompletion = new vscode.CompletionItem('on');
      onCompletion.kind = vscode.CompletionItemKind.Keyword;
      onCompletion.insertText = 'on';
      onCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // opcode
      const opcodeCompletion = new vscode.CompletionItem('opcode');
      opcodeCompletion.kind = vscode.CompletionItemKind.Keyword;
      opcodeCompletion.insertText = 'opcode';
      opcodeCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // orange
      const orangeCompletion = new vscode.CompletionItem('orange');
      orangeCompletion.kind = vscode.CompletionItemKind.Keyword;
      orangeCompletion.insertText = 'orange';
      orangeCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // output
      const outputCompletion = new vscode.CompletionItem('output');
      outputCompletion.kind = vscode.CompletionItemKind.Keyword;
      outputCompletion.insertText = 'output';
      outputCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // param
      const paramCompletion = new vscode.CompletionItem('param');
      paramCompletion.kind = vscode.CompletionItemKind.Keyword;
      paramCompletion.insertText = 'param';
      paramCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // passive
      const passiveCompletion = new vscode.CompletionItem('passive');
      passiveCompletion.kind = vscode.CompletionItemKind.Keyword;
      passiveCompletion.insertText = 'passive';
      passiveCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // phase
      const phaseCompletion = new vscode.CompletionItem('phase');
      phaseCompletion.kind = vscode.CompletionItemKind.Keyword;
      phaseCompletion.insertText = 'phase';
      phaseCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // port
      const portCompletion = new vscode.CompletionItem('port');
      portCompletion.kind = vscode.CompletionItemKind.Keyword;
      portCompletion.insertText = 'port';
      portCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // priority
      const priorityCompletion = new vscode.CompletionItem('priority');
      priorityCompletion.kind = vscode.CompletionItemKind.Keyword;
      priorityCompletion.insertText = 'priority';
      priorityCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // private
      const privateCompletion = new vscode.CompletionItem('private');
      privateCompletion.kind = vscode.CompletionItemKind.Keyword;
      privateCompletion.insertText = 'private';
      privateCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // queue
      const queueCompletion = new vscode.CompletionItem('queue');
      queueCompletion.kind = vscode.CompletionItemKind.Keyword;
      queueCompletion.insertText = 'queue';
      queueCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // queued
      const queuedCompletion = new vscode.CompletionItem('queued');
      queuedCompletion.kind = vscode.CompletionItemKind.Keyword;
      queuedCompletion.insertText = 'queued';
      queuedCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // recv
      const recvCompletion = new vscode.CompletionItem('recv');
      recvCompletion.kind = vscode.CompletionItemKind.Keyword;
      recvCompletion.insertText = 'recv';
      recvCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // red
      const redCompletion = new vscode.CompletionItem('red');
      redCompletion.kind = vscode.CompletionItemKind.Keyword;
      redCompletion.insertText = 'red';
      redCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // ref
      const refCompletion = new vscode.CompletionItem('ref');
      refCompletion.kind = vscode.CompletionItemKind.Keyword;
      refCompletion.insertText = 'ref';
      refCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // reg
      const regCompletion = new vscode.CompletionItem('reg');
      regCompletion.kind = vscode.CompletionItemKind.Keyword;
      regCompletion.insertText = 'reg';
      regCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // resp
      const respCompletion = new vscode.CompletionItem('resp');
      respCompletion.kind = vscode.CompletionItemKind.Keyword;
      respCompletion.insertText = 'resp';
      respCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // save
      const saveCompletion = new vscode.CompletionItem('save');
      saveCompletion.kind = vscode.CompletionItemKind.Keyword;
      saveCompletion.insertText = 'save';
      saveCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // serial
      const serialCompletion = new vscode.CompletionItem('serial');
      serialCompletion.kind = vscode.CompletionItemKind.Keyword;
      serialCompletion.insertText = 'serial';
      serialCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // set
      const setCompletion = new vscode.CompletionItem('set');
      setCompletion.kind = vscode.CompletionItemKind.Keyword;
      setCompletion.insertText = 'set';
      setCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // severity
      const severityCompletion = new vscode.CompletionItem('severity');
      severityCompletion.kind = vscode.CompletionItemKind.Keyword;
      severityCompletion.insertText = 'severity';
      severityCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // size
      const sizeCompletion = new vscode.CompletionItem('size');
      sizeCompletion.kind = vscode.CompletionItemKind.Keyword;
      sizeCompletion.insertText = 'size';
      sizeCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // stack
      const stackCompletion = new vscode.CompletionItem('stack');
      stackCompletion.kind = vscode.CompletionItemKind.Keyword;
      stackCompletion.insertText = 'stack';
      stackCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};;

      // sync
      const syncCompletion = new vscode.CompletionItem('sync');
      syncCompletion.kind = vscode.CompletionItemKind.Keyword;
      syncCompletion.insertText = 'sync';
      syncCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // telemetry
      const telemetryCompletion = new vscode.CompletionItem('telemetry');
      telemetryCompletion.kind = vscode.CompletionItemKind.Keyword;
      telemetryCompletion.insertText = 'telemetry';
      telemetryCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // text
      const textCompletion = new vscode.CompletionItem('text');
      textCompletion.kind = vscode.CompletionItemKind.Keyword;
      textCompletion.insertText = 'text';
      textCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // throttle
      const throttleCompletion = new vscode.CompletionItem('throttle');
      throttleCompletion.kind = vscode.CompletionItemKind.Keyword;
      throttleCompletion.insertText = 'throttle';
      throttleCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // time
      const timeCompletion = new vscode.CompletionItem('time');
      timeCompletion.kind = vscode.CompletionItemKind.Keyword;
      timeCompletion.insertText = 'time';
      timeCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // topology
      const topologyCompletion = new vscode.CompletionItem('topology');
      topologyCompletion.kind = vscode.CompletionItemKind.Keyword;
      topologyCompletion.insertText = 'topology';
      topologyCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // true
      const trueCompletion = new vscode.CompletionItem('true');
      trueCompletion.kind = vscode.CompletionItemKind.Keyword;
      trueCompletion.insertText = 'true';
      trueCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // update
      const updateCompletion = new vscode.CompletionItem('update');
      updateCompletion.kind = vscode.CompletionItemKind.Keyword;
      updateCompletion.insertText = 'update';
      updateCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // warning
      const warningCompletion = new vscode.CompletionItem('warning');
      warningCompletion.kind = vscode.CompletionItemKind.Keyword;
      warningCompletion.insertText = 'warning';
      warningCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // with
      const withCompletion = new vscode.CompletionItem('with');
      withCompletion.kind = vscode.CompletionItemKind.Keyword;
      withCompletion.insertText = 'with';
      withCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      // yellow
      const yellowCompletion = new vscode.CompletionItem('yellow');
      yellowCompletion.kind = vscode.CompletionItemKind.Keyword;
      yellowCompletion.insertText = 'yellow';
      yellowCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      return 
      [
        activeCompletion,
        activityCompletion,
        alwaysCompletion,
        assertCompletion,
        asyncCompletion,
        atCompletion,
        baseCompletion,
        blockCompletion,
        changeCompletion,
        commandCompletion,
        componentCompletion,
        connectionsCompletion,
        constantCompletion,
        cpuCompletion,
        defaultCompletion,
        diagnosticCompletion,
        dropCompletion,
        eventCompletion,
        falseCompletion,
        fatalCompletion,
        formatCompletion,
        getCompletion,
        guardedCompletion,
        healthCompletion,
        highCompletion,
        idCompletion,
        importCompletion,
        includeCompletion,
        inputCompletion,
        instanceCompletion,
        internalCompletion,
        locateCompletion,
        lowCompletion,
        matchCompletion,
        moduleCompletion,
        onCompletion,
        opcodeCompletion,
        orangeCompletion,
        outputCompletion,
        paramCompletion,
        passiveCompletion,
        phaseCompletion,
        portCompletion,
        priorityCompletion,
        privateCompletion,
        queueCompletion,
        queuedCompletion,
        recvCompletion,
        redCompletion,
        refCompletion,
        regCompletion,
        respCompletion,
        saveCompletion,
        serialCompletion,
        setCompletion,
        severityCompletion,
        sizeCompletion,
        stackCompletion,
        syncCompletion,
        telemetryCompletion,
        textCompletion,
        throttleCompletion,
        timeCompletion,
        topologyCompletion,
        trueCompletion,
        updateCompletion,
        warningCompletion,
        withCompletion,
        yellowCompletion
      ];
    }
  });

  //identifier completion
  const identifierProvider = vscode.languages.registerCompletionItemProvider('plaintext',
  {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionList>
    {
      //Variable declaration auto completion
      const variableCompletion = new vscode.CompletionItem('variable');
      variableCompletion.kind = vscode.CompletionItemKind.Variable;
      variableCompletion.insertText = 'variable';
      variableCompletion.command = {command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...'};

      const classCompletion = new vscode.CompletionItem('class');
      classCompletion.kind = vscode.CompletionItemKind.Class;
      classCompletion.insertText = 'class';
      classCompletion.command = {command: 'editor.action.triggerSuggest', title:'Re-trigger completions...'};
      
      //Need to return as array
      return 
      [
        variableCompletion,
        classCompletion
      ];
    }
  });
  //For de-registering of extension if needed
  context.subscriptions.push(keywordProvider); 
}

export function deactivate() {}
