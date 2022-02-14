# fpptools

Visual Studio Code extension for **F Prime Prime (FPP)**. Provides language support for **.fpp* files.
- https://github.com/fprime-community/fpp

FPP is a modeling language for F Prime flight software framework.
- https://nasa.github.io/fprime/

## Requirements

Node.js
- https://nodejs.org/en/

Run `npm install` in this folder to install all necessary npm modules.

## Documentation

Press `F5` to run/debug the extension.

### src/extension.ts
Main extension code.

### package.json
Manifest file required for VS Code extensions. Links the code in extension.ts.
- https://docs.npmjs.com/cli/v7/configuring-npm/package-json
- https://code.visualstudio.com/api/references/extension-manifest

### language-configuration.json
Provides basic autocompleting features.
- https://code.visualstudio.com/api/language-extensions/language-configuration-guide

### sample
Sample fpp files for feature testing.