"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodelensProvider = void 0;
const vscode = require("vscode");
/**
 * CodelensProvider
 */
class CodelensProvider {
    constructor() {
        this.codeLenses = [];
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
        this.regex = /(.+)/g;
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }
    provideCodeLenses(document, token) {
        if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
            this.codeLenses = [];
            const regex = new RegExp(this.regex);
            const text = document.getText();
            let matches;
            while ((matches = regex.exec(text)) !== null) {
                const line = document.lineAt(document.positionAt(matches.index).line);
                const indexOf = line.text.indexOf(matches[0]);
                const position = new vscode.Position(line.lineNumber, indexOf);
                const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
                if (range) {
                    this.codeLenses.push(new vscode.CodeLens(range));
                }
            }
            return this.codeLenses;
        }
        return [];
    }
    resolveCodeLens(codeLens, token) {
        if (vscode.workspace.getConfiguration("codelens-sample").get("enableCodeLens", true)) {
            codeLens.command = {
                title: "Codelens provided by sample extension",
                tooltip: "Tooltip provided by sample extension",
                command: "codelens-sample.codelensAction",
                arguments: ["Argument 1", false]
            };
            return codeLens;
        }
        return null;
    }
}
exports.CodelensProvider = CodelensProvider;
//# sourceMappingURL=CodelensProvider.js.map