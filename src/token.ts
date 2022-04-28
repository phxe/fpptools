import * as FPP from "./constants";

export interface ParsedToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: FPP.TokenType;
  tokenModifiers: FPP.ModifierType[];
  text: string;
}

export interface SemanticToken {
  line: number;
  startCharacter: number;
  length: number;
  tokenType: FPP.TokenType;
  tokenModifiers: FPP.ModifierType[];
}
