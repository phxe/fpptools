import * as FPP from "./constants";

export module Parser {
  export function parseTextToken(text: string): FPP.TokenType {
    switch (text) {
      case FPP.Symbols.QUOTE:
      case FPP.Symbols.TQUOTE:
        return FPP.TokenType.STRING;
      case FPP.Symbols.COMMENT:
        return FPP.TokenType.COMMENT;
      case FPP.Symbols.PREANNOTATION:
        return FPP.TokenType.ANNOTATION;
      case FPP.Symbols.POSTANNOTATION:
        return FPP.TokenType.ANNOTATION;
      default:
        if (FPP.isMember(text, FPP.Types)) {
          return FPP.TokenType.TYPE;
        }
        if (FPP.isMember(text, FPP.Keywords)) {
          return FPP.TokenType.KEYWORD;
        }
        if (FPP.isValue(text, FPP.Operators)) {
          return FPP.TokenType.OPERATOR;
        }
        if (isNumber(text)) {
          return FPP.TokenType.NUMBER;
        }
        return FPP.TokenType.NIL;
    }
  }

  export function isIdentifier(str: string): boolean {
    if (FPP.isMember(str, FPP.Keywords)) {
      return false;
    }
    if (str[0] === "$" && str[1] !== "$") {
      return isIdentifier(str.substring(1, str.length - 2));
    }
    if (!(isAlpha(str[0]) || str[0] === "_")) {
      return false;
    }
    for (var i = 0; i < str?.length; i++) {
      if (!(isAlpha(str[i]) || isInteger(str[i]) || str[i] === "_")) {
        return false;
      }
    }
    return true;
  }

  export function isNumber(str: string): boolean {
    if (str[0] === "-" && str[1] !== "-") {
      return isNumber(str.substring(1, str.length));
    }
    if (str[0] + str[1]?.toLowerCase() === "0x") {
      return isHex(str.substring(2, str.length));
    }
    if (str.includes(".")) {
      return isFloat(str);
    }
    return isInteger(str);
  }

  export function isInteger(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (str[i] < "0" || str[i] > "9") {
        return false;
      }
    }
    return true;
  }

  function isAlpha(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (str[i].toLowerCase() < "a" || str[i].toLowerCase() > "z") {
        return false;
      }
    }
    return true;
  }

  function isHex(str: string): boolean {
    for (var i = 0; i < str?.length; i++) {
      if (!((str[i].toLowerCase() >= "a" && str[i].toLowerCase() <= "f") || isInteger(str[i]))) {
        return false;
      }
    }
    return true;
  }

  function isFloat(str: string): boolean {
    return isInteger(str.substring(0, str.indexOf("."))) && isInteger(str.substring(str.indexOf(".") + 1, str.length));
  }
}
