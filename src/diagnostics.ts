import * as vscode from "vscode";
import { ParsedToken } from "./token";

export module Diagnostics {
  export var collection: vscode.DiagnosticCollection;
  if (vscode.workspace.getConfiguration().get("fpp.diagnostics", true)) {
    collection = vscode.languages.createDiagnosticCollection();
  }

  // convenience function that creates a diagnostic for a specific token
  export function createFromToken(errString: string, token: ParsedToken, severity: vscode.DiagnosticSeverity) {
    var startPosition = new vscode.Position(token.line, token.startCharacter);
    var endPosition = new vscode.Position(token.line, token.startCharacter + token.length);
    create(errString, startPosition, endPosition, token.line, severity);
  }

  // convenience function that creates a diagnostic for an entire line
  export function createFromLine(errString: string, line: number, severity: vscode.DiagnosticSeverity) {
    var startPosition = new vscode.Position(line, 0);
    var endPosition = new vscode.Position(line, Number.MAX_VALUE);
    create(errString, startPosition, endPosition, line, severity);
  }

  // creates a new diagnostic for the currently opened file
  function create(
    errString: string,
    startPosition: vscode.Position,
    endPosition: vscode.Position,
    lineNum: number,
    severity: vscode.DiagnosticSeverity
  ) {
    if (vscode.window.activeTextEditor !== undefined) {
      var newDiag = new vscode.Diagnostic(new vscode.Range(startPosition, endPosition), errString, severity);
      add(newDiag, vscode.window.activeTextEditor.document);
    }
  }

  // adds a diagnostic to the currently opened file for display
  function add(diag: vscode.Diagnostic, doc: vscode.TextDocument) {
    var diags = vscode.languages.getDiagnostics(doc.uri);
    diags.push(diag);
    collection?.set(doc.uri, diags);
  }

  // clears all diagnostics for a particular file, to ensure old diagnostics are thrown away if no longer valid
  export function clear(doc: vscode.TextDocument) {
    collection?.set(doc.uri, []);
  }
}
