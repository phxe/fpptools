"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode_1 = require("vscode");
const CodelensProvider_1 = require("./CodelensProvider");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let disposables = [];
function activate(context) {
    const codelensProvider = new CodelensProvider_1.CodelensProvider();
    vscode_1.languages.registerCodeLensProvider("*", codelensProvider);
    vscode_1.commands.registerCommand("codelens-sample.enableCodeLens", () => {
        vscode_1.workspace.getConfiguration("codelens-sample").update("enableCodeLens", true, true);
    });
    vscode_1.commands.registerCommand("codelens-sample.disableCodeLens", () => {
        vscode_1.workspace.getConfiguration("codelens-sample").update("enableCodeLens", false, true);
    });
    vscode_1.commands.registerCommand("codelens-sample.codelensAction", (args) => {
        vscode_1.window.showInformationMessage(`CodeLens action clicked with args=${args}`);
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    if (disposables) {
        disposables.forEach(item => item.dispose());
    }
    disposables = [];
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map