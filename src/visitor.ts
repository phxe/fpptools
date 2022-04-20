import * as FPP from "./constants";
import { Diagnostics } from "./diagnostics";
import { Parser, tokens } from "./parser";

const identifiers = new Map<string, [string, FPP.TokenType, FPP.TokenType[]]>();
const currentScope: [string, FPP.TokenType][] = [["", FPP.TokenType.NIL]];

export module Visitor {
  export interface VisitedToken {
    line: number;
    startCharacter: number;
    length: number;
    tokenType: FPP.TokenType;
    text: string;
    tokenModifiers: FPP.TokenType[];
  }

  export function visitDocument(): VisitedToken[] {
    let visitedTokens: VisitedToken[] = [];
    let index = 0;
    while (index < tokens.length) {
      // prettier-ignore
      switch (tokens[index].text) {
        // Definitions
        case FPP.Keywords.array:    index = visitArrayDef(index); break;
        case FPP.Keywords.active:
        case FPP.Keywords.passive:
        case FPP.Keywords.queued:   index = visitComponentDef(index); break;
        case FPP.Keywords.constant: index = visitConstantDef(index); break;
        case FPP.Keywords.instance: index = visitComponentInstanceDef(index); break;
        case FPP.Keywords.enum:     index = visitEnumDef(index); break;
        case FPP.Keywords.module:   index = visitModuleDef(index); break;
        case FPP.Keywords.port:     index = visitPortDef(index); break;
        case FPP.Keywords.struct:   index = visitStructDef(index); break;
        case FPP.Keywords.type:     index = visitTypeDef(index); break;
        case FPP.Keywords.topology: index = visitTopologyDef(index); break;
        // Specifiers
        case FPP.Keywords.locate:   index = visitLocationSpec(index); break;
        case FPP.Keywords.event:    index = visitEventSpec(index); break;
        case FPP.Operators.BSLASH: break;
        default:
          switch (tokens[index].tokenType) {
            case FPP.TokenType.STRING:
            case FPP.TokenType.COMMENT:
            case FPP.TokenType.ANNOTATION:
              break;
            default:
              // Error
              Diagnostics.createFromToken(
                "Unexpected token: " + tokens[index].text,
                tokens[index],
                0
              );
          }
      }
      if (currentScope.length === 0) {
        currentScope.push(["", FPP.TokenType.NIL]);
      }
      if (currentScope.length !== 1) {
        console.log("Resetting Scope\t\tCurrent Token:\t" + tokens[index].text);
        currentScope.length = 1;
      }
      index++;
    }
    identifiers.clear();
    return visitedTokens;
  }

  function getNextLineIndex(index: number): number {
    let thisLine = tokens[index].line;
    while (index++ < tokens.length && tokens[index]?.line === thisLine) {}
    return index;
  }

  function ignoreNonsemanticTokens(index: number): number {
    while (
      index < tokens.length &&
      (tokens[index].tokenType === FPP.TokenType.COMMENT ||
        tokens[index].tokenType === FPP.TokenType.ANNOTATION ||
        tokens[index].text === FPP.Operators.BSLASH)
    ) {
      console.log("Skipping Nonsemantic Token\tCurrent Token:\t", tokens[index].text);
      index++;
    }
    if (index >= tokens.length) {
      identifiers.clear();
      if (currentScope.length === 0) {
        currentScope.push(["", FPP.TokenType.NIL]);
      }
      throw FPP.eof;
    }

    return index;
  }

  function lookAhead(index: number): string {
    index = ignoreNonsemanticTokens(++index);
    return tokens[index]?.text;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //---------------------------\\ G E N E R I C S //---------------------------\\
  //---------------------------------------------------------------------------\\

  function visitToken(index: number, expectedToken: any, required: boolean): number {
    index = ignoreNonsemanticTokens(index);
    console.log("Expecting Token(s):\t", expectedToken, "\tCurrent Token:\t", tokens[index].text);
    if (expectedToken.includes(tokens[index].text)) {
      return index;
    } else {
      if (required) {
        let thisLine = tokens[index].line;
        let i = index;
        // Look for token on the rest of the line
        while (i < tokens.length && tokens[i]?.line === thisLine) {
          if (expectedToken.includes(tokens[i].text)) {
            // Error
            Diagnostics.createFromToken(
              "Expected: " + expectedToken + "\nFound: " + tokens[i].text,
              tokens[i],
              0
            );
            console.log("Located Token:\t\t" + tokens[i].text + "\tJumping Index");
            return i;
          } else {
            i++;
          }
        }
        // Error
        Diagnostics.createFromToken(
          "Expected: " + expectedToken + "\nFound: " + tokens[index].text,
          tokens[index],
          0
        );
        return index;
      } else {
        return index - 1;
      }
    }
  }

  function visitType(index: number): number {
    index = ignoreNonsemanticTokens(index);
    console.log("Visiting Type\t\t\tCurrent Token:\t", tokens[index].text);
    if (FPP.isMember(tokens[index].text, FPP.Types)) {
      if (tokens[index].text === FPP.Keywords.string && lookAhead(index) === FPP.Keywords.size) {
        index = ignoreNonsemanticTokens(++index);
        index = visitExpression(++index);
      }
      return index;
    } else if (identifiers.has(tokens[index].text)) {
      return visitQualifiedIdentifier(index);
    }
    // Error
    // Temporarily allow if valid identifer until identifier reimplementation
    if (Parser.isIdentifier(tokens[index].text)) {
      return visitQualifiedIdentifier(index);
    } else {
      Diagnostics.createFromToken("Invalid type: " + tokens[index].text, tokens[index], 0);
    }
    return index;
  }

  function visitString(index: number): number {
    index = ignoreNonsemanticTokens(index);
    console.log("Visiting String\t\t\tCurrent Token:\t", tokens[index].text);
    if (tokens[index].tokenType !== FPP.TokenType.STRING) {
      // Error
      Diagnostics.createFromToken(
        "String expected\nFound: " + tokens[index].text,
        tokens[index],
        0
      );
    }
    return index;
  }

  //------------------------\\ E X P R E S S I O N S //------------------------\\

  function visitExpression(index: number): number {
    index = ignoreNonsemanticTokens(index);
    console.log("Visiting Expression\t\tCurrent Token:\t", tokens[index].text);

    switch (tokens[index].text) {
      case FPP.Operators.MINUS:
        return visitExpression(++index);
      case FPP.Operators.LPAREN:
        return visitParenthesisExpression(++index);
      case FPP.Operators.LBRACKET:
        return visitArrayExpression(index);
      default:
        if (Parser.isIdentifier(tokens[index].text)) {
          index = visitQualifiedIdentifier(index);
        } else if (tokens[index].tokenType === FPP.TokenType.NUMBER) {
        } else {
          // Error
          Diagnostics.createFromToken(
            "Invalid expression: " + tokens[index].text,
            tokens[index],
            0
          );
        }
    }

    switch (lookAhead(index)) {
      case FPP.Operators.MINUS:
      case FPP.Operators.PLUS:
      case FPP.Operators.MULT:
      case FPP.Operators.DIV:
        index = ignoreNonsemanticTokens(++index);
        return visitExpression(++index);
    }

    return index;
  }

  function visitParenthesisExpression(index: number): number {
    console.log("Visiting Parenthesis Expression\tCurrent Token:\t", tokens[index].text);
    index = visitExpression(++index);
    index = visitToken(++index, FPP.Operators.RPAREN, true);
    return index;
  }

  function visitArrayExpression(index: number): number {
    console.log("Visiting Array Expression\tCurrent Token:\t", tokens[index].text);
    index = visitExpression(++index);
    while (lookAhead(index) !== FPP.Operators.RBRACKET) {
      index = visitToken(++index, FPP.Operators.COMMA, true);
      index = visitExpression(++index);
    }
    index = visitToken(++index, FPP.Operators.RBRACKET, true);
    return index;
  }

  //------------------------\\ I D E N T I F I E R S //------------------------\\

  // TODO: Implement checking for qual-ident of a certain type
  function visitQualifiedIdentifier(index: number): number {
    index = visitIdentifier(index);
    while (lookAhead(index) === FPP.Operators.DOT) {
      index = ignoreNonsemanticTokens(++index);
      index = visitIdentifier(++index);
    }
    return index;
  }

  function visitIdentifier(index: number): number {
    index = ignoreNonsemanticTokens(index);
    // TODO: Check for qual-ident
    if (identifiers.has(tokens[index].text)) {
      console.log("Identifier Found\t\tCurrent Token:\t", tokens[index].text);
      tokens[index].tokenType = identifiers.get(tokens[index].text)?.[1] as FPP.TokenType;
      tokens[index].tokenModifiers = identifiers.get(tokens[index].text)?.[2] as FPP.TokenType[];
      return index;
    } else {
      // Error
      console.log("Unknown Identifier\t\tCurrent Token:\t", tokens[index].text);
      // TODO: Add after reimplementation
      // Diagnostics.createFromToken("Unknown identifier: " + tokens[index].text, tokens[index], 0);
      return index;
    }
  }

  function visitIdentifierDef(
    index: number,
    type: FPP.TokenType,
    modifiers: FPP.TokenType[]
  ): number {
    index = ignoreNonsemanticTokens(index);
    tokens[index].tokenType = type;
    tokens[index].tokenModifiers = modifiers.slice();
    if (Parser.isIdentifier(tokens[index].text)) {
      if (identifiers.has(tokens[index].text)) {
        // Error
        console.log("Duplicate Identifier\t\tCurrent Token:\t", tokens[index].text);
        // Diagnostics.createFromToken(
        //   "Cannot redeclare variable: " + tokens[index].text,
        //   tokens[index],
        //   0
        // );
      } else {
        console.log("New Identifier\t\t\tCurrent Token:\t", tokens[index].text);
        let i;
        if ((i = modifiers.findIndex((mod) => mod === FPP.TokenType.DECLARATION)) !== -1) {
          delete modifiers[i];
          identifiers.set(tokens[index].text, [
            currentScope[currentScope.length - 1][0],
            type,
            modifiers.slice(),
          ]);
          switch (tokens[index].tokenType) {
            case FPP.TokenType.ENUM:
            case FPP.TokenType.COMPONENT:
            case FPP.TokenType.NAMESPACE:
              console.log("New Scope\t\t\tCurrent Token:\t", tokens[index].text);
              currentScope.push([tokens[index].text, tokens[index].tokenType]);
            default:
              break;
          }
        } else {
          identifiers.set(tokens[index].text, [
            currentScope[currentScope.length - 1][0],
            type,
            modifiers.slice(),
          ]);
        }
      }
    } else {
      // Error
      console.log("Invalid Identifier\t\tCurrent Token:\t", tokens[index].text);
      Diagnostics.createFromToken("Invalid Identifier: " + tokens[index].text, tokens[index], 0);
      return index;
    }
    return index;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //------------------------\\ D E F I N I T I O N S //------------------------\\
  //---------------------------------------------------------------------------\\

  // Abstract Type Definitions
  // Syntax:
  // type identifier
  function visitTypeDef(index: number): number {
    console.log("Visiting Type Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.TYPE, [
      FPP.TokenType.DECLARATION,
      FPP.TokenType.ABSTRACT,
    ]);
    return index;
  }

  // Array Definitions
  // Syntax:
  // array identifier = [ expression ] type-name [ default expression ] [ format string-literal ]
  function visitArrayDef(index: number): number {
    console.log("Visiting Array Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.ARRAY, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.EQ, true);
    index = visitToken(++index, FPP.Operators.LBRACKET, true);
    index = visitExpression(++index);
    index = visitToken(++index, FPP.Operators.RBRACKET, true);
    index = visitType(++index);
    if (lookAhead(index) === FPP.Keywords.default) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.format) {
      index = ignoreNonsemanticTokens(++index);
      index = visitString(++index);
    }
    return index;
  }

  // Component Definitions
  // Syntax:
  // component-kind component identifier { component-member-sequence }
  function visitComponentDef(index: number): number {
    console.log("Visiting Component Definition\tCurrent Token:\t", tokens[index]?.text);
    index = visitToken(++index, FPP.Keywords.component, true);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.COMPONENT, [
      FPP.TokenType.DECLARATION,
    ]);
    index = visitToken(++index, FPP.Operators.LBRACE, true);
    index = visitComponentMemberSequence(++index);
    return index;
  }

  // Component Instance Definitions
  // Syntax:
  // instance identifier : qual-ident base id expression [ at string-literal ] [ queue size expression ]
  // [ stack size expression ] [ priority expression ] [ cpu expression ] [ { init-specifier-sequence } ]
  function visitComponentInstanceDef(index: number): number {
    console.log("Visiting Instance Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.INSTANCE, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.COLON, true);
    index = visitQualifiedIdentifier(++index);
    index = visitToken(++index, FPP.Keywords.base, true);
    index = visitToken(++index, FPP.Keywords.id, true);
    index = visitExpression(++index);
    if (lookAhead(index) === FPP.Keywords.at) {
      index = ignoreNonsemanticTokens(++index);
      index = visitString(++index);
    }
    if (lookAhead(index) === FPP.Keywords.queue) {
      index = ignoreNonsemanticTokens(++index);
      index = visitToken(++index, FPP.Keywords.size, true);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.stack) {
      index = ignoreNonsemanticTokens(++index);
      index = visitToken(++index, FPP.Keywords.size, true);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.priority) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.cpu) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Operators.LBRACE) {
      index = ignoreNonsemanticTokens(++index);
      index = visitInitSpecSequence(++index);
    }
    return index;
  }

  // Constant Definitions
  // Syntax:
  // constant identifier = expression
  function visitConstantDef(index: number): number {
    console.log("Visiting Constant Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.CONSTANT, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.EQ, true);
    index = visitExpression(++index);
    return index;
  }

  // Enum Definitions
  // Syntax:
  // enum identifier [ : type-name ] { enum-constant-sequence } [ default expression ]
  function visitEnumDef(index: number): number {
    console.log("Visiting Enum Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.ENUM, [FPP.TokenType.DECLARATION]);
    if (lookAhead(index) === FPP.Operators.COLON) {
      index = ignoreNonsemanticTokens(++index);
      index = visitType(++index);
    }
    index = visitToken(++index, FPP.Operators.LBRACE, true);
    index = visitEnumConstantSequence(index);
    if (lookAhead(index) === FPP.Keywords.default) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    return index;
  }

  // Enumerated Constant Definitions
  // Syntax:
  // identifier [ = expression ]
  function visitEnumConstantDef(index: number): number {
    console.log("Visiting Enum Constant Def\tCurrent Token:\t", tokens[index].text);
    index = visitIdentifierDef(index, FPP.KeywordTokensMap.ENUMMEMBER, [FPP.TokenType.DECLARATION]);
    if (lookAhead(index) === FPP.Operators.EQ) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    return index;
  }

  // Module Definitions
  // Syntax:
  // module identifier { module-member-sequence }
  function visitModuleDef(index: number): number {
    console.log("Visiting Module Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.MODULE, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.LBRACE, true);
    index = visitModuleMemberSequence(++index);
    return index;
  }

  // Port Definitions
  // Syntax:
  // port identifier [ ( param-list ) ] [ -> type-name ]
  function visitPortDef(index: number): number {
    console.log("Visiting Port Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PORT, [FPP.TokenType.DECLARATION]);
    if (lookAhead(index) === FPP.Operators.LPAREN) {
      index = ignoreNonsemanticTokens(++index);
      index = visitParamList(++index);
    }
    if (lookAhead(index) === FPP.Operators.RARROW) {
      index = ignoreNonsemanticTokens(++index);
      index = visitType(++index);
    }
    return index;
  }

  // Struct Definitions
  // Syntax:
  // struct identifier { struct-type-member-sequence } [ default expression ]
  function visitStructDef(index: number): number {
    console.log("Visiting Struct Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.STRUCT, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.LBRACE, true);
    index = visitStructMemberSequence(++index);
    if (lookAhead(index) === FPP.Keywords.default) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    return index;
  }

  // Topology Definitions
  // Syntax:
  // topology identifier { topology-member-sequence }
  function visitTopologyDef(index: number): number {
    console.log("Visiting Topology Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.TOPOLOGY, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.LBRACE, true);
    index = visitTopologyMemberSequence(++index);
    return index;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //-------------------------\\ S P E C I F I E R S //-------------------------\\
  //---------------------------------------------------------------------------\\

  // Command Specifiers
  // Syntax:
  // command-kind command identifier [ ( param-list ) ] [ opcode expression ] [ priority expression ] [ queue-full-behavior ]
  function visitCommandSpec(index: number): number {
    console.log("Visiting Command Specifier\tNext Token:\t", tokens[index + 1]?.text);
    let queueFullSpec = false;
    if (tokens[index].text === FPP.Keywords.async) {
      queueFullSpec = true;
    }
    index = visitToken(++index, FPP.Keywords.command, true);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.SPECIFIER, [
      FPP.TokenType.DECLARATION,
    ]);
    if (lookAhead(index) === FPP.Operators.LPAREN) {
      index = ignoreNonsemanticTokens(++index);
      index = visitParamList(++index);
    }
    if (lookAhead(index) === FPP.Keywords.opcode) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.priority) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    if (queueFullSpec) {
      index = visitToken(
        ++index,
        [FPP.Keywords.assert, FPP.Keywords.block, FPP.Keywords.drop],
        false
      );
    }
    return index;
  }

  // Component Instance Specifiers
  // Syntax:
  // [ private ] instance qual-ident
  // Note: qual-ident must refer to a component instance
  function visitComponentInstanceSpec(index: number): number {
    console.log("Visiting Component Instance Specifier\tNext Token:\t", tokens[index + 1]?.text);
    index = visitQualifiedIdentifier(++index);
    return index;
  }

  // Connection Graph Specifiers
  // Syntax:
  // connections identifier { connection-sequence }
  // pattern-kind connections instance qual-ident [ { instance-sequence } ]
  // Note: qual-ident must refer to a component instance that is available in the enclosing topology
  function visitConnectionGraphSpec(index: number): number {
    console.log("Visiting Connection Graph Specifier\tCurrent Token:\t", tokens[index].text);
    if (tokens[index].text === FPP.Keywords.connections) {
      index = visitIdentifierDef(++index, FPP.KeywordTokensMap.SPECIFIER, [
        FPP.TokenType.DECLARATION,
      ]);
      index = visitToken(++index, FPP.Operators.LBRACE, true);
      index = visitConnectionSequence(index);
    } else {
      index = visitToken(++index, FPP.Keywords.connections, true);
      index = visitToken(++index, FPP.Keywords.instance, true);
      index = visitQualifiedIdentifier(++index);
      if (lookAhead(index) === FPP.Operators.LBRACE) {
        index = ignoreNonsemanticTokens(++index);
        index = visitInstanceSequence(++index);
      }
    }
    return index;
  }

  // Event Specifiers
  // Syntax:
  // event identifier [ ( param-list ) ] severity severity [ id expression ] format string-literal [ throttle expression ]
  function visitEventSpec(index: number): number {
    console.log("Visiting Event Specifier\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.SPECIFIER, [
      FPP.TokenType.DECLARATION,
    ]);
    if (lookAhead(index) === FPP.Operators.LPAREN) {
      index = ignoreNonsemanticTokens(++index);
      index = visitParamList(++index);
    }
    index = visitToken(++index, FPP.Keywords.severity, true);
    if (lookAhead(index) === FPP.Keywords.activity || lookAhead(index) === FPP.Keywords.warning) {
      index = ignoreNonsemanticTokens(++index);
      visitToken(++index, [FPP.Keywords.high, FPP.Keywords.low], true);
    } else {
      index = visitToken(
        ++index,
        [FPP.Keywords.command, FPP.Keywords.diagnostic, FPP.Keywords.fatal],
        true
      );
    }
    if (lookAhead(index) === FPP.Keywords.id) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    index = visitToken(++index, FPP.Keywords.format, true);
    index = visitString(++index);
    if (lookAhead(index) === FPP.Keywords.throttle) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    return index;
  }

  // Include Specifiers
  // Syntax:
  // include string-literal
  function visitIncludeSpec(index: number): number {
    console.log("Visiting Include Specifier\tNext Token:\t", tokens[index + 1]?.text);
    index = visitString(++index);
    return index;
  }

  // Init Specifiers
  // Syntax:
  // phase expression string-literal
  function visitInitSpec(index: number): number {
    console.log("Visiting Init Specifier\tNext Token:\t", tokens[index + 1]?.text);
    index = visitExpression(++index);
    index = visitString(++index);
    return index;
  }

  // Internal Port Specifiers
  // Syntax:
  // internal port identifier [ ( param-list ) ] [ priority expression ] [ queue-full-behavior ]
  function visitInternalPortSpec(index: number): number {
    console.log("Visiting Internal Port Specifier\tNext Token:\t", tokens[index + 1]?.text);
    index = visitToken(++index, FPP.Keywords.port, true);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.SPECIFIER, [
      FPP.TokenType.DECLARATION,
    ]);
    if (lookAhead(index) === FPP.Operators.LPAREN) {
      index = ignoreNonsemanticTokens(++index);
      index = visitParamList(++index);
    }
    if (lookAhead(index) === FPP.Keywords.priority) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    index = visitToken(
      ++index,
      [FPP.Keywords.assert, FPP.Keywords.block, FPP.Keywords.drop],
      false
    );
    return index;
  }

  // Location Specifiers
  // Syntax:
  // locate instance qual-ident at string-literal
  // locate component qual-ident at string-literal
  // locate constant qual-ident at string-literal
  // locate port qual-ident at string-literal
  // locate topology qual-ident at string-literal
  // locate type qual-ident at string-literal
  function visitLocationSpec(index: number): number {
    console.log("Visiting Location Specifier\tNext Token:\t", tokens[index + 1]?.text);
    index = visitToken(
      ++index,
      [
        FPP.Keywords.instance,
        FPP.Keywords.component,
        FPP.Keywords.constant,
        FPP.Keywords.port,
        FPP.Keywords.topology,
        FPP.Keywords.type,
      ],
      true
    );
    index = visitQualifiedIdentifier(++index);
    index = visitToken(++index, FPP.Keywords.at, true);
    index = visitString(++index);
    return index;
  }

  // Parameter Specifiers
  // Syntax:
  // param identifier : type-name [ default expression ] [ id expression ] [ set opcode expression ] [ save opcode expression ]
  function visitParamSpec(index: number): number {
    console.log("Visiting Parameter Specifier\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.SPECIFIER, [
      FPP.TokenType.DECLARATION,
    ]);
    index = visitToken(++index, FPP.Operators.COLON, true);
    index = visitType(++index);
    if (lookAhead(index) === FPP.Keywords.default) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.id) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.set) {
      index = ignoreNonsemanticTokens(++index);
      index = visitToken(++index, FPP.Keywords.opcode, true);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.save) {
      index = ignoreNonsemanticTokens(++index);
      index = visitToken(++index, FPP.Keywords.opcode, true);
      index = visitExpression(++index);
    }
    return index;
  }

  // Port Instance Specifiers
  // Syntax:
  // general-port-kind port identifier : [ [ expression ] ] port-instance-type [ priority expression ] [ queue-full-behavior ]
  // special-port-kind port identifier
  function visitPortInstanceSpec(index: number): number {
    console.log("Visiting Port Instance Specifier\tCurrent Token:\t", tokens[index].text);
    let queueFullSpec = false;
    let generalPortKind = false;
    switch (tokens[index].text) {
      case FPP.Keywords.async:
        queueFullSpec = true;
      case FPP.Keywords.guarded:
      case FPP.Keywords.sync:
        index = visitToken(++index, FPP.Keywords.input, true);
        generalPortKind = true;
        break;
      case FPP.Keywords.output:
        generalPortKind = true;
        break;
      case FPP.Keywords.command:
        index = visitToken(++index, [FPP.Keywords.recv, FPP.Keywords.reg, FPP.Keywords.resp], true);
        break;
      case FPP.Keywords.param:
        index = visitToken(++index, [FPP.Keywords.set, FPP.Keywords.get], true);
        break;
      case FPP.Keywords.text:
        index = visitToken(++index, FPP.Keywords.event, true);
        break;
      case FPP.Keywords.time:
        index = visitToken(++index, FPP.Keywords.get, true);
        break;
      case FPP.Keywords.telemetry:
      case FPP.Keywords.event:
        break;
      default:
      // Error
    }
    index = visitToken(++index, FPP.Keywords.port, true);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PORT, [FPP.TokenType.DECLARATION]);
    if (generalPortKind) {
      index = visitToken(++index, FPP.Operators.COLON, true);
      if (lookAhead(index) === FPP.Operators.LBRACKET) {
        index = ignoreNonsemanticTokens(++index);
        index = visitExpression(++index);
        index = visitToken(++index, FPP.Operators.RBRACKET, true);
      }
      if (lookAhead(index) === FPP.Keywords.serial) {
        index = ignoreNonsemanticTokens(++index);
      } else {
        index = visitQualifiedIdentifier(++index);
      }
      if (lookAhead(index) === FPP.Keywords.priority) {
        index = ignoreNonsemanticTokens(++index);
        index = visitExpression(++index);
      }
      if (queueFullSpec) {
        index = visitToken(
          ++index,
          [FPP.Keywords.assert, FPP.Keywords.block, FPP.Keywords.drop],
          false
        );
      }
    }
    return index;
  }

  // Port Matching Specifiers
  // Syntax:
  // [ private ] instance qual-ident
  function visitPortMatchingSpec(index: number): number {
    console.log("Visiting Port Matching Specifier\tNext Token:\t", tokens[index + 1]?.text);
    // TODO: Check private
    index = visitIdentifier(++index);
    index = visitToken(++index, FPP.Keywords.with, true);
    index = visitIdentifier(++index);
    return index;
  }

  // Telemetry Channel Specifiers
  // Syntax:
  // telemetry identifier : type-name [ id expression ] [ update telemetry-update ] [ format string-literal ]
  // [ low { telemetry-limit-sequence } ] [ high { telemetry-limit-sequence } ]
  function visitTelemetryChannelSpec(index: number): number {
    console.log("Visiting Telemetry Specifier\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.SPECIFIER, [
      FPP.TokenType.DECLARATION,
    ]);
    index = visitToken(++index, FPP.Operators.COLON, true);
    index = visitType(++index);
    if (lookAhead(index) === FPP.Keywords.id) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
    }
    if (lookAhead(index) === FPP.Keywords.update) {
      index = ignoreNonsemanticTokens(++index);
      if (lookAhead(index) === FPP.Keywords.always) {
        index = ignoreNonsemanticTokens(++index);
      } else if (lookAhead(index) === FPP.Keywords.on) {
        index = ignoreNonsemanticTokens(++index);
        index = visitToken(++index, FPP.Keywords.change, true);
      }
    }
    if (lookAhead(index) === FPP.Keywords.format) {
      index = ignoreNonsemanticTokens(++index);
      index = visitString(++index);
    }
    if (lookAhead(index) === FPP.Keywords.low) {
      index = ignoreNonsemanticTokens(++index);
      index = visitToken(++index, FPP.Operators.LBRACE, true);
      index = visitTelemetrySequence(++index);
    }
    if (lookAhead(index) === FPP.Keywords.high) {
      index = ignoreNonsemanticTokens(++index);
      index = visitToken(++index, FPP.Operators.LBRACE, true);
      index = visitTelemetrySequence(++index);
    }
    return index;
  }

  // Topology Import Specifiers
  // Syntax:
  // import qual-ident
  // Note: qual-ident must refer to a topology definition
  function visitTopologyImportSpec(index: number): number {
    console.log("Visiting Topology Import Specifier\tCurrent Token:\t", tokens[index].text);
    index = visitQualifiedIdentifier(++index);
    return ++index;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //--------------------------\\ S E Q U E N C E S //--------------------------\\
  //---------------------------------------------------------------------------\\

  // Enum Constant Sequence
  // Used in enum definition
  function visitEnumConstantSequence(index: number): number {
    console.log("Visiting enum-constant-sequence\tNext Token:\t", tokens[index + 1]?.text);
    while (++index < tokens.length && tokens[index]?.text !== FPP.Operators.RBRACE) {
      index = visitEnumConstantDef(index);
      index = visitToken(++index, FPP.Operators.COMMA, false);
    }
    currentScope.pop();
    return index;
  }

  // Component Member Sequence
  // Used in component definition
  function visitComponentMemberSequence(index: number): number {
    console.log("Visiting component-member-seq\tCurrent Token:\t", tokens[index].text);
    while (index < tokens.length && tokens[index].text !== FPP.Operators.RBRACE) {
      switch (tokens[index].text) {
        // An array definition
        case FPP.Keywords.array:
          index = visitArrayDef(index);
          break;
        // A constant definition
        case FPP.Keywords.constant:
          index = visitConstantDef(index);
          break;
        // An enum definition
        case FPP.Keywords.enum:
          index = visitEnumDef(index);
          break;
        // A struct definition
        case FPP.Keywords.struct:
          index = visitStructDef(index);
          break;
        // An abstract type definition
        case FPP.Keywords.type:
          index = visitTypeDef(index);
          break;
        // A parameter specifier
        case FPP.Keywords.param:
          if (lookAhead(index) === FPP.Keywords.get || lookAhead(index) === FPP.Keywords.set) {
            index = visitPortInstanceSpec(index);
          } else {
            index = visitParamSpec(index);
          }
          break;
        // A command specifier
        case FPP.Keywords.async:
        case FPP.Keywords.guarded:
        case FPP.Keywords.sync:
          if (lookAhead(index) === FPP.Keywords.input) {
            index = visitPortInstanceSpec(index);
          } else {
            index = visitCommandSpec(index);
          }
          break;
        // A port instance specifier
        case FPP.Keywords.output:
          index = visitPortInstanceSpec(index);
          break;
        case FPP.Keywords.command:
        case FPP.Keywords.text:
        case FPP.Keywords.time:
          index = visitPortInstanceSpec(index);
          break;
        // A telemetry channel specifier
        case FPP.Keywords.telemetry:
          if (lookAhead(index) === FPP.Keywords.port) {
            index = visitPortInstanceSpec(index);
          } else {
            index = visitTelemetryChannelSpec(index);
          }
          break;
        // An event specifier
        case FPP.Keywords.event:
          if (lookAhead(index) === FPP.Keywords.port) {
            index = visitPortInstanceSpec(index);
          } else {
            index = visitEventSpec(index);
          }
          break;
        // An include specifier
        case FPP.Keywords.include:
          index = visitIncludeSpec(index);
          break;
        // An internal port specifier
        case FPP.Keywords.internal:
          index = visitInternalPortSpec(index);
          break;
        // A port matching specifier
        case FPP.Keywords.match:
          index = visitPortMatchingSpec(index);
          break;
        default:
        // Error
      }
      index = ignoreNonsemanticTokens(++index);
    }
    currentScope.pop();
    return index;
  }

  // [ ref ] identifier : type-name
  function visitParamList(index: number): number {
    console.log("Visiting param-list\tCurrent Token:\t", tokens[index].text);
    while (index < tokens.length && tokens[index].text !== FPP.Operators.RPAREN) {
      index = visitToken(index, FPP.Keywords.ref, false);
      index = visitIdentifierDef(++index, FPP.TokenType.PARAMETER, [FPP.TokenType.DECLARATION]);
      index = visitToken(++index, FPP.Operators.COLON, true);
      index = visitType(++index);
      index = ignoreNonsemanticTokens(++index);
    }
    return index;
  }

  function visitTelemetrySequence(index: number): number {
    if (tokens[index]?.text === FPP.Operators.LBRACE) {
      console.log("Visiting Telemetry Sequence");
      let validNext = true;
      if (++index < tokens.length) {
        do {
          if (FPP.Operators.RBRACE === tokens[index]?.text) {
            console.log("Leaving Telemetry Sequence");
            return index;
          } else if (!validNext && tokens[index - 1].line === tokens[index].line) {
            console.log("Invalid Telemetry Sequence\tCurrent Token:", tokens[index]?.text);
            return index;
          }
          telemetryLimit: {
            if (
              index ===
              (index = visitToken(
                index,
                [FPP.Keywords.red, FPP.Keywords.yellow, FPP.Keywords.orange],
                true
              ))
            ) {
              if (index >= (index = visitExpression(++index))) {
                break telemetryLimit;
              }
            }
            console.log("Invalid telemetry limit.\tCurrent Token: ", tokens[index]?.text);
          }
          if (FPP.Operators.COMMA === tokens[index]?.text) {
            index++;
            validNext = true;
          } else {
            validNext = false;
          }
        } while (true);
      }
    }
    return index;
  }

  // Init Specifier Sequence
  // Used in component definition
  function visitInitSpecSequence(index: number): number {
    console.log("Visiting init-specifier-seq\tCurrent Token:\t", tokens[index].text);
    while (index < tokens.length && tokens[index].text !== FPP.Operators.RBRACE) {
      if (tokens[index].text === FPP.Keywords.phase) {
        index = visitInitSpec(index);
      } else {
        index++;
      }
    }
    return index;
  }

  function visitModuleMemberSequence(index: number): number {
    console.log("Visiting module-member-seq\tCurrent Token:\t", tokens[index].text);
    while (index < tokens.length && tokens[index].text !== FPP.Operators.RBRACE) {
      switch (tokens[index].text) {
        case FPP.Keywords.active:
        case FPP.Keywords.passive:
        case FPP.Keywords.queued:
          // A component definition
          index = visitComponentDef(index);
          break;
        // A component instance definition
        case FPP.Keywords.instance:
          index = visitComponentInstanceDef(index);
          break;
        // A constant definition
        case FPP.Keywords.constant:
          index = visitConstantDef(index);
          break;
        // A module definition
        case FPP.Keywords.module:
          index = visitModuleDef(index);
          break;
        // A port definition
        case FPP.Keywords.port:
          index = visitPortDef(index);
          break;
        // A struct definition
        case FPP.Keywords.struct:
          index = visitStructDef(index);
          break;
        // A topology definition
        case FPP.Keywords.topology:
          index = visitTopologyDef(index);
          break;
        // A location specifier
        case FPP.Keywords.locate:
          index = visitLocationSpec(index);
          break;
        // An abstract type definition
        case FPP.Keywords.type:
          index = visitType(index);
          break;
        // An array definition
        case FPP.Keywords.array:
          index = visitArrayDef(index);
          break;
        // An enum definition
        case FPP.Keywords.enum:
          index = visitEnumDef(index);
          break;
        // An include specifier
        case FPP.Keywords.include:
          index = visitIncludeSpec(index);
          break;
        default:
        //Error
      }
      index = ignoreNonsemanticTokens(++index);
    }
    return index;
  }

  function visitStructMemberSequence(index: number): number {
    if (tokens[index]?.text === FPP.Operators.LBRACE) {
      console.log("Visiting Struct Type Member Sequence");
      let validNext = true;
      if (++index < tokens.length) {
        do {
          if (FPP.Operators.RBRACE === tokens[index]?.text) {
            console.log("Leaving Struct Member Sequence");
            return index;
          } else if (!validNext && tokens[index - 1].line === tokens[index].line) {
            console.log("Invalid Struct Member Sequence\tCurrent Token:", tokens[index]?.text);
            return index;
          }
          if (index >= (index = visitStructTypeMember(index)) || ++index >= tokens.length) {
            break;
          }
          if (FPP.Operators.COMMA === tokens[index]?.text) {
            index++;
            validNext = true;
          } else {
            validNext = false;
          }
        } while (true);
      }
      console.log("Invalid exit of Struct Member Sequence\tCurrent Token:", tokens[index]?.text);
    }
    return index;
  }

  function visitTopologyMemberSequence(index: number): number {
    console.log("Visiting Topology Member Sequence\tNext Token:\t", tokens[index + 1]?.text);

    while (++index < tokens.length && tokens[index].text !== FPP.Operators.RBRACE) {
      switch (tokens[index].text) {
        // component instance specifier
        case FPP.Keywords.private:
          if (tokens[++index].text === FPP.Keywords.instance) {
            index = visitComponentInstanceSpec(index);
          } else {
            // Error. Expected keyword instance
          }
        case FPP.Keywords.instance:
          index = visitComponentInstanceSpec(index);
          break;
        // connection graph specifier
        case FPP.Keywords.connections:
        case FPP.Keywords.command:
        case FPP.Keywords.event:
        case FPP.Keywords.health:
        case FPP.Keywords.param:
        case FPP.Keywords.telemetry:
        case FPP.Keywords.time:
          index = visitConnectionGraphSpec(index);
          break;
        // topology import specifier
        case FPP.Keywords.import:
          index = visitTopologyImportSpec(index);
          break;
        // include specifier
        case FPP.Keywords.include:
          index = visitIncludeSpec(index);
          break;
        default:
        // Error
      }
    }
    return index;
  }

  // For direct graph specifiers
  // port-instance-id [ [ expression ] ] -> port-instance-id [ [ expression ] ]
  function visitConnectionSequence(index: number): number {
    console.log("Visiting Connection Sequence\tCurrent Token:\t", tokens[index].text);
    while (++index < tokens.length && tokens[index].text !== FPP.Operators.RBRACE) {
      index = visitQualifiedIdentifier(index);
      if (lookAhead(index) === FPP.Operators.LBRACKET) {
        index = ignoreNonsemanticTokens(++index);
        index = visitExpression(++index);
        index = visitToken(++index, FPP.Operators.RBRACKET, true);
      }
      index = visitToken(++index, FPP.Operators.RARROW, true);
      index = visitQualifiedIdentifier(++index);
      if (lookAhead(index) === FPP.Operators.LBRACKET) {
        index = ignoreNonsemanticTokens(++index);
        index = visitExpression(++index);
        index = visitToken(++index, FPP.Operators.RBRACKET, true);
      }
    }
    return index;
  }

  // For pattern graph specifiers
  function visitInstanceSequence(index: number): number {
    console.log("Visiting Instance Sequence\tNext Token:\t", tokens[++index].text);
    // TO DO
    return index;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //----------------------------\\ S P E C I A L //----------------------------\\
  //---------------------------------------------------------------------------\\

  // identifier : [ [ expression ] ] type-name [ format string-literal ]
  function visitStructTypeMember(index: number): number {
    console.log("Visiting Struct Type Member\tCurrent Token:\t", tokens[index]?.text);
    if (Parser.isIdentifier(tokens[index].text)) {
      console.log("New Identifier\t\t\tCurrent Token:\t", tokens[index].text);
      tokens[index].tokenType = FPP.KeywordTokensMap.PARAM;
      tokens[index].tokenModifiers = [FPP.TokenType.DECLARATION, FPP.TokenType.PARAMETER];
    } else {
      console.log("Invalid Identifier\t\tCurrent Token:\t", tokens[index].text);
      // Error
      let thisLine = tokens[index].line;
      while (tokens[index++].line === thisLine) {}
      return index;
    }
    index = visitToken(++index, FPP.Operators.COLON, true);
    if (lookAhead(index) === FPP.Operators.LBRACKET) {
      index = ignoreNonsemanticTokens(++index);
      index = visitExpression(++index);
      if (tokens[index + 1]?.text !== FPP.Operators.RBRACKET) {
        console.log("Invalid closed expression");
      }
      index++;
    }
    index = visitType(++index);
    if (lookAhead(index) === FPP.Keywords.format) {
      index = ignoreNonsemanticTokens(++index);
      index = visitString(++index);
    }
    return index;
  }
}
