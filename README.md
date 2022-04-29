# FPPTools

Welcome to the Visual Studio Code extension for **F Prime Prime (FPP)**. This extension provides language support for FPP (\*_.fpp_ and \*_.fppi_).

---

### [F Prime Prime](https://github.com/fprime-community/fpp)

> FPP is a modeling language for the F Prime flight software (FSW) framework developed by JPL. FPP can be used to generate XML and C++ using [FPP compiler tools](https://github.com/fprime-community/fpp/wiki/Tools). Developers may combine code generated from FPP with code written by hand to create, e.g., deployable FSW programs and ground data environments.

### [F Prime](https://nasa.github.io/fprime/)

> F´ (or F Prime) is a software framework for the rapid development and deployment of embedded systems and spaceflight applications. Originally developed at NASA’s Jet Propulsion Laboratory, F´ is open-source software that has been successfully deployed for several space applications. It has been used for but is not limited to, CubeSats, SmallSats, instruments, and deployable.

---

## Features

### Syntax Highlighting

Syntactic highlighting of FPP tokens is performed using VS Code's tokenization engine, [TextMate grammars](https://macromates.com/manual/en/language_grammars). FPP tokens are grouped in the following patterns:

- Keywords
  - Control
  - Type
- Operators
- Identifiers
- Numbers
- Strings
- Comments
- Annotations

---

# For Developers

## Requirements

### Node.js

> https://nodejs.org/en/

- Run `npm install` to install dependencies
- Open in Visual Studio Code (`code .`)
- Press <kbd>F5</kbd> to debug

## Tools

### Inspect Tokens and Scopes

To view the classification of tokens, press <kbd>F1</kbd> and type `Developer: Inspect Editor Tokens and Scopes`. This will show token details from the TextMate tokenization engine as well as any other semantic token provider.

## License

Licensed under the Apache License, Version 2.0

See LICENSE

---

## UNLV Computer Science Senior Design Team

This extension was created by students at the University of Nevada, Las Vegas in collaboration with JPL.

See CONTRIBUTORS.md
