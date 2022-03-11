import { close } from "fs";
import * as FPP from "./constants";
import { Parser } from "./parser";

export module Scanner {
  export function scanDocument(text: string): Parser.ParsedToken[] {
    const tokens: Parser.ParsedToken[] = [];
    const lines = text.split(/\r\n|\r|\n/);
    let index = 0;
    let textToken = "";
    let tokenType = "";

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
        tokenType = parseUnique(textToken);

        index = closeIndex;

        // Special token handling
        switch (tokenType) {
          case FPP.Symbols.BSLASH:
            tokenType = FPP.TokenType.operator;
            // TODO
            // backslash identifies a new line, other wise something needs to be next to the declaration
            // example: constant a \
            //              = 1
            // this is acceptable, without the \ the code should show an error
            console.log(line);
            console.log(line.lastIndexOf("\\")); // should present the BSLASH
            // need to know what is on the next line below BSLASH
            // matching the datatype to its appropriate value if on separate lines

            // if there isn't a BSLASH check to see if the current line is properly finished off
            // this being with a variable declaration, or some statement
            // ENSURE that the BSLASH is applicable to the statement/whatever
            console.log(line[line.indexOf("\\")]); // this will identify the BSLASH index on every line
            if (line.lastIndexOf("\\")) {
              tokens.push({
                line: i,
                startCharacter: line.indexOf("\\"),
                length: line.length - line.indexOf("\\"),
                tokenType: tokenType,
                text: textToken,
                tokenModifiers: [""],
              });
            }
            break;
          case FPP.Symbols.QUOTE:
            while (
              (line[closeIndex] !== '"' && closeIndex < line.length) ||
              (line[closeIndex] === '"' &&
                line[closeIndex - 1] === "\\" &&
                closeIndex < line.length)
            ) {
              closeIndex++;
            }
            closeIndex++;
            index = closeIndex;
            tokenType = FPP.TokenType.string;
            break;
          case FPP.Symbols.TQUOTE:
            tokenType = FPP.TokenType.string;
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
                    tokenModifiers: [""],
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
            break;
          // Tokenize remaining line for comments and annotations
          case FPP.TokenType.comment:
          case FPP.TokenType.annotation:
            textToken = line.substring(openIndex);
            index = line.length;
            closeIndex = index;
            break;
        }

        tokens.push({
          line: i,
          startCharacter: openIndex,
          length: closeIndex - openIndex,
          tokenType: tokenType,
          text: textToken,
          tokenModifiers: [""],
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

  function parseUnique(text: string): string {
    switch (text) {
      case FPP.Symbols.BSLASH:
        return FPP.Symbols.BSLASH;
      case FPP.Symbols.TQUOTE:
        return FPP.Symbols.TQUOTE;
      case FPP.Symbols.QUOTE:
        return FPP.Symbols.QUOTE;
      case FPP.Symbols.COMMENT:
        return FPP.TokenType.comment;
      case FPP.Symbols.PREANNOTATION:
        return FPP.TokenType.annotation;
      case FPP.Symbols.POSTANNOTATION:
        return FPP.TokenType.annotation;
      default:
        if (Parser.isNumber(text)) {
          return FPP.TokenType.number;
        } else {
          return FPP.TokenType.nil;
        }
    }
  }
}
