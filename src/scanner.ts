import * as FPP from "./constants";
import { Parser } from "./parser";
import { ParsedToken } from "./token";

export module Scanner {
  export function scanDocument(text: string): ParsedToken[] {
    const tokens: ParsedToken[] = [];
    const lines = text.split(/\r\n|\r|\n/);
    let index = 0;
    let textToken = "";
    let tokenType: FPP.TokenType = FPP.TokenType.NIL;

    for (let i = 0; i < lines.length; i++) {
      index = 0;
      let line = lines[i];

      // Scan line
      while (index < line.length) {
        if (line[index] === " ") {
          index++;
          continue;
        }

        // Scan token
        let openIndex = index;
        let closeIndex = getCloseIndex(line, index);

        // Handle multi-character operators/symbols
        if (closeIndex === openIndex) {
          switch (line[closeIndex] + line[closeIndex + 1]) {
            case FPP.Symbols.POSTANNOTATION:
            case FPP.Operators.RARROW:
              closeIndex++;
            default:
              break;
          }
          if (line.substring(closeIndex, closeIndex + 3) === FPP.Symbols.TQUOTE) {
            closeIndex += 2;
          }
          closeIndex++;
        }

        textToken = line.substring(openIndex, closeIndex);
        tokenType = Parser.parseTextToken(textToken);

        index = closeIndex;

        // Special token handling
        switch (tokenType) {
          case FPP.TokenType.STRING:
            if (textToken === FPP.Symbols.QUOTE) {
              let k = closeIndex;
              while ((line[k] !== '"' && k < line.length) || (line[k] === '"' && line[k - 1] === "\\" && k < line.length)) {
                k++;
              }
              if (k !== line.length) {
                closeIndex = k + 1;
                index = closeIndex;
                textToken = line.substring(openIndex, closeIndex);
              }
            } else if (textToken === FPP.Symbols.TQUOTE) {
              if ((closeIndex = line.substring(index).indexOf(FPP.Symbols.TQUOTE)) !== -1) {
                closeIndex += index + 3;
                index = closeIndex;
              } else {
                for (let j = i; j < lines.length; j++) {
                  if ((closeIndex = lines[j].substring(index).indexOf(FPP.Symbols.TQUOTE)) === -1) {
                    closeIndex = lines[j].length;
                    tokens.push({
                      line: j,
                      startCharacter: openIndex,
                      length: closeIndex,
                      tokenType: tokenType,
                      text: textToken,
                      tokenModifiers: [],
                    });
                    openIndex = 0;
                    index = 0;
                  } else {
                    closeIndex += 3;
                    index = line.length;
                    i = j;
                    break;
                  }
                  if (j === lines.length - 1) {
                    return tokens;
                  }
                }
              }
            }
            break;
          // Tokenize remaining line
          case FPP.TokenType.ANNOTATION:
            textToken = line.substring(openIndex);
            index = line.length;
            closeIndex = index;
            break;
          case FPP.TokenType.COMMENT:
            index = line.length;
            continue;
        }

        tokens.push({
          line: i,
          startCharacter: openIndex,
          length: closeIndex - openIndex,
          tokenType: tokenType,
          text: textToken,
          tokenModifiers: [],
        });
      }
    }
    return tokens;
  }

  function getCloseIndex(text: string, curr: number): number {
    while (!isBreakpoint(text[curr]) && curr < text.length) {
      curr++;
    }
    // Check float vs dot expression
    if (text[curr] === "." && Parser.isInteger(text[curr + 1])) {
      return getCloseIndex(text, curr + 1);
    }
    return curr;
  }

  function isBreakpoint(char: string): boolean {
    if (char === " ") {
      return true;
    }
    if (FPP.isValue(char, FPP.Symbols)) {
      return true;
    }
    if (FPP.isValue(char, FPP.Operators)) {
      return true;
    }
    return false;
  }
}
