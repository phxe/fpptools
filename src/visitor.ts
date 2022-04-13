import * as FPP from "./constants";
import { Diagnostics } from "./diagnostics";
import { Parser, tokens } from "./parser";

const identifiers = new Map<string, [string, FPP.TokenType, FPP.TokenType[]]>();
const currentScope: string[] = [""];

// TODO: Ignore comments, annotations, and the new line suppressor in visitors
// const currentScope = new Map<string, FPP.TokenType>();

export module Visitor {
  export function visitDocument() {
    if (tokens.length === 0) {
      return -1;
    }
    let index = 0;
    while (index < tokens.length) {
      switch (tokens[index].text) {
        case FPP.Keywords.array:
          index = visitArrayDef(index);
          break;
        case FPP.Keywords.active:
        case FPP.Keywords.passive:
        case FPP.Keywords.queued:
          index = visitComponentDef(index);
          break;
        case FPP.Keywords.constant:
          index = visitConstantDef(index);
          break;
        case FPP.Keywords.instance:
          index = visitInstanceDef(index);
          break;
        case FPP.Keywords.enum:
          index = visitEnumDef(index);
          break;
        case FPP.Keywords.module:
          index = visitModuleDef(index);
          break;
        case FPP.Keywords.port:
          index = visitPortDef(index);
          break;
        case FPP.Keywords.struct:
          index = visitStructDef(index);
          break;
        case FPP.Keywords.type:
          index = visitTypeDef(index);
          break;
        case FPP.Keywords.topology:
          index = visitTopologyDef(index);
          break;
        case FPP.Operators.BSLASH:
          break;
        default:
          switch (tokens[index].tokenType) {
            case FPP.TokenType.STRING:
            case FPP.TokenType.COMMENT:
            case FPP.TokenType.ANNOTATION:
              break;
            default:
              // Error
              Diagnostics.createFromToken(
                "Sample Error 1: " + tokens[index].text,
                tokens[index],
                0
              );
          }
      }
      console.log("Resetting Scope\t\tCurrent Token:\t" + tokens[index].text);
      currentScope.length = 1;
      index++;
    }
    identifiers.clear();
  }

  function getNextLineIndex(index: number): number {
    let thisLine = tokens[index].line;
    while (tokens[index++]?.line === thisLine) {}
    return index;
  }

  function ignoreNonsemanticTokens(index: number): number {
    while (
      tokens[index].tokenType === FPP.TokenType.COMMENT ||
      tokens[index].tokenType === FPP.TokenType.ANNOTATION ||
      tokens[index].text === FPP.SuppressionOperators.BSLASH
    ) {
      console.log("Skipping Nonsemantic Token\tCurrent Token:\t", tokens[index].text);
      index++;
    }
    return index;
  }

  function lookAhead(index: number): string {
    index = ignoreNonsemanticTokens(index);
    return tokens[index]?.text;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //---------------------------\\ G E N E R I C S //---------------------------\\
  //---------------------------------------------------------------------------\\

  function visitToken(index: number, expectedToken: any, required: boolean = false): number {
    // if (index - 1 === (index = visitNewlineSupression(index))) {
    //   if (required) {
    //     // Error
    //     Diagnostics.createFromToken("Sample Error 2: " + tokens[index].text, tokens[index], 0);
    //   }
    //   return index;
    // }
    index = ignoreNonsemanticTokens(index);
    console.log("Expecting Token(s):\t", expectedToken, "\tCurrent Token:\t", tokens[index].text);
    if (expectedToken.includes(tokens[index].text)) {
      return index;
    } else {
      if (required) {
        let thisLine = tokens[index].line;
        // Look for token on the rest of the line
        while (tokens[index++].line === thisLine) {
          if (expectedToken.includes(tokens[index].text)) {
            console.log("Located Token:\t\t" + tokens[index].text + "\tJumping Index");
            return index;
          }
        }
        // Error
        Diagnostics.createFromToken(
          "Expected: " + expectedToken + "\nFound: " + tokens[index].text,
          tokens[index],
          0
        );
        return index - 1;
      } else {
        return index - 1;
      }
      return index;
    }
  }

  function visitType(index: number): number {
    // if (index - 1 === (index = visitNewlineSupression(index))) {
    //   // Error
    //   Diagnostics.createFromToken("Sample Error 4: " + tokens[index].text, tokens[index], 0);
    //   return index;
    // }
    index = ignoreNonsemanticTokens(index);
    console.log("Visiting Type\t\t\tCurrent Token:\t", tokens[index].text);
    if (FPP.isMember(tokens[index].text, FPP.Types)) {
      return index;
    } else if (identifiers.has(tokens[index].text)) {
      return visitIdentifier(index);
    }
    // Error
    Diagnostics.createFromToken("Sample Error 5: " + tokens[index].text, tokens[index], 0);
    return index - 1;
  }

  function visitString(index: number): number {
    // if (index - 1 === (index = visitNewlineSupression(index))) {
    //   // Error
    //   Diagnostics.createFromToken("Sample Error 6: " + tokens[index].text, tokens[index], 0);
    //   return index;
    // }
    index = ignoreNonsemanticTokens(index);
    console.log("Visiting String\t\t\tCurrent Token:\t", tokens[index].text);
    if (tokens[index].tokenType !== FPP.TokenType.STRING) {
      // Error
      Diagnostics.createFromToken("Sample Error 7: " + tokens[index].text, tokens[index], 0);
    }
    return index;
  }

  // function visitNewlineSupression(index: number): number {
  //   // if (
  //   //   tokens[index - 1]?.line !== tokens[index].line &&
  //   //   !FPP.isValue(tokens[index - 1].text, FPP.SuppressionOperators)
  //   // ) {
  //   //   // Error
  //   //   Diagnostics.createFromToken("Sample Error 8: " + tokens[index].text, tokens[index], 0);
  //   //   return index - 1;
  //   // }
  //   while (tokens[index].text === FPP.SuppressionOperators.BSLASH) {
  //     console.log("Skipping Newline Suppression\tCurrent Token:\t", tokens[index].text);
  //     index++;
  //   }
  //   return index;
  // }

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
        return visitArrayExpression(++index);
      default:
        if (Parser.isIdentifier(tokens[index].text)) {
          index = visitIdentifier(index);
        } else if (tokens[index].tokenType === FPP.TokenType.NUMBER) {
        } else {
          // Error
        }
    }

    switch (lookAhead(index)) {
      case FPP.Operators.MINUS:
      case FPP.Operators.PLUS:
      case FPP.Operators.MULT:
      case FPP.Operators.DIV:
        return visitExpression(++index);
    }

    return index;
  }

  function visitParenthesisExpression(index: number): number {
    console.log("Visiting Parenthesis Expression\tCurrent Token:\t", tokens[index].text);
    index = visitExpression(index);
    index = visitToken(++index, FPP.Operators.RPAREN, true);
    return index;
  }

  function visitArrayExpression(index: number): number {
    console.log("Visiting Array Expression\tCurrent Token:\t", tokens[index].text);
    while (tokens[index].text === FPP.Operators.COMMA || Parser.isNumber(tokens[index].text)) {
      index++;
    }
    index = visitToken(index, FPP.Operators.RBRACKET, true);
    return index;
  }

  //------------------------\\ I D E N T I F I E R S //------------------------\\

  function visitQualifiedIdentifier(index: number): number {
    index = visitIdentifier(index);
    while (tokens[index + 1]?.text === FPP.Operators.DOT) {
      index = visitIdentifier(index + 2);
    }
    return index;
  }

  function visitIdentifier(index: number): number {
    // if (index - 1 === (index = visitNewlineSupression(index))) {
    //   // Error
    //   Diagnostics.createFromToken("Sample Error 12: " + tokens[index].text, tokens[index], 0);
    //   return index;
    // }
    index = ignoreNonsemanticTokens(index);
    if (identifiers.has(tokens[index].text)) {
      console.log("Identifier Found\t\tCurrent Token:\t", tokens[index].text);
      tokens[index].tokenType = identifiers.get(tokens[index].text)?.[1] as FPP.TokenType;
      tokens[index].tokenModifiers = identifiers.get(tokens[index].text)?.[2] as FPP.TokenType[];
      return index;
    } else {
      // Error
      console.log("Invalid Identifier\t\tCurrent Token:\t", tokens[index].text);
      Diagnostics.createFromToken("Invalid Identifier: " + tokens[index].text, tokens[index], 0);
      return index - 1;
    }
  }

  function visitIdentifierDef(
    index: number,
    type: FPP.TokenType,
    modifiers: FPP.TokenType[]
  ): number {
    // if (index - 1 === (index = visitNewlineSupression(index))) {
    //   // Error
    //   Diagnostics.createFromToken("Sample Error 13: " + tokens[index].text, tokens[index], 0);
    //   return index;
    // }
    index = ignoreNonsemanticTokens(index);
    tokens[index].tokenType = type;
    tokens[index].tokenModifiers = modifiers.slice();
    if (Parser.isIdentifier(tokens[index].text)) {
      if (identifiers.has(tokens[index].text)) {
        // Error
        Diagnostics.createFromToken("Sample Error 14: " + tokens[index].text, tokens[index], 0);
      } else {
        console.log("New Identifier\t\t\tCurrent Token:\t", tokens[index].text);
        let i;
        if ((i = modifiers.findIndex((mod) => mod === FPP.TokenType.DECLARATION)) !== -1) {
          delete modifiers[i];
          identifiers.set(tokens[index].text, [
            currentScope[currentScope.length - 1],
            type,
            modifiers.slice(),
          ]);
          switch (tokens[index].tokenType) {
            case FPP.TokenType.ENUM:
            case FPP.TokenType.COMPONENT:
            case FPP.TokenType.NAMESPACE:
              console.log("New Scope\t\t\tCurrent Token:\t", tokens[index].text);
              currentScope.push(tokens[index].text);
            default:
              break;
          }
        } else {
          identifiers.set(tokens[index].text, [
            currentScope[currentScope.length - 1],
            type,
            modifiers.slice(),
          ]);
        }
      }
    } else {
      // Error
      console.log("Invalid Identifier\t\tCurrent Token:\t", tokens[index].text);
      Diagnostics.createFromToken("Invalid Identifier: " + tokens[index].text, tokens[index], 0);
      return index - 1;
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
    // if (tokens[index]?.text !== FPP.Keywords.array) {
    //   console.log("Error - expected 'array'");
    // }
    // if (Parser.isIdentifier(tokens[++index].text)) {
    //   if (identifiers.has(tokens[index].text)) {
    //     console.log("Identifier Found\t\tCurrent Token:\t", tokens[index].text);
    //     tokens[index].tokenType = identifiers.get(tokens[index].text)?.[0] as FPP.TokenType;
    //     tokens[index].tokenModifiers = identifiers.get(tokens[index].text)?.[2] as FPP.TokenType[];
    //   } else {
    //     console.log("New Identifier\t\t\tCurrent Token:\t", tokens[index].text);
    //     identifiers.set(tokens[index].text, [tokens[index].text, FPP.TokenType.ENUMMEMBER, []]);
    //   }
    // } else {
    //   console.log("Invalid Identifier\t\tCurrent Token:\t", tokens[index].text);
    //   // Error
    //   let thisLine = tokens[index].line;
    //   while (tokens[index++].line === thisLine) {}
    //   return index;
    // }
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.ARRAY, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.EQ, true);
    index = visitToken(++index, FPP.Operators.LBRACKET, true);
    index = visitExpression(++index);
    index = visitToken(++index, FPP.Operators.RBRACKET, true);
    index = visitType(++index);
    if (tokens[index + 1]?.text === FPP.Keywords.default) {
      index = visitExpression(index + 2);
    }
    if (tokens[index + 1]?.text === FPP.Keywords.format) {
      index = visitString(index + 2);
    }
    return index;
  }

  // Component Definitions
  // Syntax:
  // component-kind component identifier { component-member-sequence }
  function visitComponentDef(index: number): number {
    console.log("Visiting Component Definition\tNext Token:\t", tokens[index + 2]?.text);
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
  function visitInstanceDef(index: number): number {
    console.log("Visiting Instance Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.INSTANCE, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.COLON, true);
    index = visitQualifiedIdentifier(++index);
    index = visitToken(++index, FPP.Keywords.base, true);
    let a = tokens[index].text;
    index = visitToken(++index, FPP.Keywords.id, true);
    let b = tokens[index].text;
    index = visitExpression(++index);
    let c = tokens[index].text;
    let visited = new Array<number>(6);
    let done = false;
    // TODO: Remove while loop
    while (!done) {
      switch (tokens[index + 1]?.text) {
        case FPP.Operators.BSLASH:
          index++;
          break;
        case FPP.Keywords.at:
          if (!visited[0]) {
            index = visitString(index + 2);
          }
          break;
        case FPP.Keywords.queue:
          if (!visited[1]) {
            index = visitToken(index + 2, FPP.Keywords.size, true);
            index = visitExpression(++index);
          }
          break;
        case FPP.Keywords.stack:
          if (!visited[2]) {
            index = visitToken(index + 2, FPP.Keywords.size, true);
            index = visitExpression(++index);
          }
          break;
        case FPP.Keywords.priority:
          if (!visited[3]) {
            index = visitExpression(index + 2);
          }
          break;
        case FPP.Keywords.cpu:
          if (!visited[4]) {
            index = visitExpression(index + 2);
          }
          break;
        case FPP.Operators.LBRACE:
          if (!visited[5]) {
            index = visitInitSpecSequence(index + 2);
          }
          break;
        default:
          done = true;
      }
    }
    return index;
  }

  // Constant Definitions
  // Syntax:
  // constant identifier = expression
  function visitConstantDef(index: number): number {
    console.log("Visiting Constant Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.CONSTANT, [
      FPP.TokenType.DECLARATION,
      FPP.TokenType.READONLY,
    ]);
    if (++index === visitToken(index, FPP.Operators.EQ, true)) {
      index = visitExpression(++index);
    }
    return index;
  }

  // Enum Definitions
  // Syntax:
  // enum identifier [ : type-name ] { enum-constant-sequence } [ default expression ]
  function visitEnumDef(index: number): number {
    console.log("Visiting Enum Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.ENUM, [FPP.TokenType.DECLARATION]);
    if (tokens[index + 1]?.text === FPP.Operators.COLON) {
      index = visitType(index + 2);
    }
    if (index !== (index = visitToken(++index, FPP.Operators.LBRACE, false))) {
      index = visitEnumConstantSequence(index);
      if (tokens[index + 1]?.text === FPP.Keywords.default) {
        index = visitExpression(index + 2);
      }
    }
    return index;
  }

  // Enumerated Constant Definitions
  // Syntax:
  // identifier [ = expression ]
  function visitEnumConstantDef(index: number): number {
    console.log("Visiting Enum Constant Def\tCurrent Token:\t", tokens[index].text);
    index = visitIdentifierDef(index, FPP.TokenType.ENUMMEMBER, [FPP.TokenType.DECLARATION]);
    if (tokens[index + 1]?.text === FPP.Operators.EQ) {
      index = visitExpression(index + 2);
    }
    return index;
  }

  // Module Definitions
  // Syntax:
  // module identifier { module-member-sequence }
  function visitModuleDef(index: number): number {
    console.log("Visiting Module Definition\tNext Token:\t", tokens[index + 1]?.text);
    if (tokens[index]?.text === FPP.Keywords.module) {
      index = visitIdentifierDef(++index, FPP.KeywordTokensMap.MODULE, [FPP.TokenType.DECLARATION]);
      if (tokens[++index].text === FPP.Operators.LBRACE) {
        index = visitModuleMemberSequence(++index);
      } else {
        // Error
      }
    }
    return index;
  }

  // Port Definitions
  // Syntax:
  // port identifier [ ( param-list ) ] [ -> type-name ]
  function visitPortDef(index: number): number {
    console.log("Visiting Port Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PORT, [
      FPP.TokenType.DECLARATION,
      FPP.TokenType.READONLY,
    ]);
    index = visitParamList(++index);
    if (index === (index = visitToken(++index, FPP.Operators.RARROW, true))) {
      index = visitType(++index);
    }
    return index;
  }

  // Struct Definitions
  // Syntax:
  // struct identifier { struct-type-member-sequence } [ default expression ]
  function visitStructDef(index: number): number {
    console.log("Visiting Struct Definition\tNext Token:\t", tokens[index + 1]?.text);
    if (tokens[index]?.text === FPP.Keywords.struct) {
      index = visitIdentifierDef(++index, FPP.KeywordTokensMap.STRUCT, [FPP.TokenType.DECLARATION]);
      index = visitStructMemberSequence(++index);
      if (tokens[index + 1]?.text === FPP.Keywords.default) {
        index = visitStructElementSequence(index + 2);
      }
    } else {
      // Error
    }
    return index;
  }

  // Topology Definitions
  // Syntax:
  // topology identifier { topology-member-sequence }
  function visitTopologyDef(index: number): number {
    console.log("Visiting Topology Definition\tNext Token:\t", tokens[index + 1]?.text);

    if (identifiers.has(tokens[index].text)) {
      // Error. Identifier already exists
    } else {
      index = visitIdentifierDef(++index, FPP.KeywordTokensMap.TOPOLOGY, [
        FPP.TokenType.DECLARATION,
      ]);
    }
    if (index < (index = visitToken(++index, FPP.Operators.LBRACE, true))) {
      index = visitTopologyMemberSequence(index);
    } else {
      // Error
    }

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
    switch (tokens[index]?.text) {
      case FPP.Keywords.async:
        queueFullSpec = true;
      case FPP.Keywords.sync:
      case FPP.Keywords.guarded:
        console.log("Found command-kind\t\tCurrent Token:\t", tokens[index]?.text);
        break;
      default:
        console.log("Invalid command-kind\tCurrent Token:\t", tokens[index]?.text);
        return index;
    }
    if (index === (index = visitToken(++index, FPP.Keywords.command, true))) {
      console.log("Invalid command specifier sequence\tCurrent Token:\t", tokens[index]?.text);
      return index;
    }
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.COMPONENT, []);
    index = visitParamList(++index);
    if (index < (index = visitToken(++index, FPP.Keywords.opcode, true))) {
      console.log("Found opcode expression");
      if (index >= (index = visitExpression(++index))) {
        console.log("Invalid opcode expression\tCurrent Token:\t", tokens[index]?.text);
      }
    }
    if (index < (index = visitToken(++index, FPP.Keywords.priority, true))) {
      console.log("Found priority expression");
      if (index >= (index = visitExpression(++index))) {
        console.log("Invalid priority expression\tCurrent Token:\t", tokens[index]?.text);
      }
    }
    if (
      index <
      (index = visitToken(
        ++index,
        [FPP.Keywords.assert, FPP.Keywords.block, FPP.Keywords.drop],
        true
      ))
    ) {
      if (!queueFullSpec) {
        console.log("queue-full-behavior may only be indicated in an 'async' queue");
      } else {
        console.log("Found queue-full-behavior adjective, '" + tokens[index]?.text + "'");
      }
    }
    return index;
  }

  // Component Instance Specifiers
  // Syntax:
  // [ private ] instance qual-ident
  // Note: qual-ident must refer to a component instance
  function visitComponentInstanceSpec(index: number): number {
    console.log("Visiting Component Instance Specifier\tCurrent Token:\t", tokens[index].text);

    if (tokens[index]?.text !== FPP.Keywords.instance) {
      // Error
    }
    if (identifiers.has(tokens[index + 1].text)) {
      index = visitQualifiedIdentifier(++index);
    } else {
      index = visitIdentifierDef(++index, FPP.KeywordTokensMap.INSTANCE, [
        FPP.TokenType.DECLARATION,
      ]);
    }

    return index;
  }

  // Connection Graph Specifiers
  // Syntax:
  // connections identifier { connection-sequence }
  // pattern-kind connections instance qual-ident [ { instance-sequence } ]
  // Note: qual-ident must refer to a component instance that is available in the enclosing topology
  function visitConnectionGraphSpec(index: number): number {
    console.log("Visiting Connection Graph Specifier\tCurrent Token:\t", tokens[index].text);

    switch (tokens[index].text) {
      case FPP.Keywords.connections:
        index = visitIdentifierDef(++index, FPP.KeywordTokensMap.CONNECTIONS, [
          FPP.TokenType.DECLARATION,
        ]);
        if (index === (index = visitConnectionSequence(index))) {
          // Error
          return index;
        }
        break;
      case FPP.Keywords.command:
      case FPP.Keywords.event:
      case FPP.Keywords.health:
      case FPP.Keywords.param:
      case FPP.Keywords.telemetry:
      case FPP.Keywords.time:
        console.log("Found pattern-kind\tCurrent Token:\t", tokens[index].text);
        if (index === (index = visitToken(++index, FPP.Keywords.connections, true))) {
          // Error
          return index;
        }
        if (index === (index = visitToken(++index, FPP.Keywords.instance, true))) {
          // Error
          return index;
        }
        index = visitQualifiedIdentifier(++index);
        if (index < (index = visitToken(++index, FPP.Operators.LBRACE, false))) {
          index = visitInstanceSequence(++index);
        }
        break;
      default:
        // Error
        return index;
    }

    return index;
  }

  // Event Specifiers
  // Syntax:
  // event identifier [ ( param-list ) ] severity severity [ id expression ] format string-literal [ throttle expression ]
  function visitEventSpec(index: number): number {
    console.log("Visiting Event Specifier\tNext Token:\t", tokens[index + 1]?.text);
    if (tokens[index]?.text === FPP.Keywords.event) {
      index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PORT, [FPP.TokenType.DECLARATION]);
      index = visitParamList(++index);
      if (index < (index = visitToken(++index, FPP.Keywords.severity, true))) {
        checkSeverity: {
          if (
            index <
            (index = visitToken(++index, [FPP.Keywords.activity, FPP.Keywords.warning], true))
          ) {
            if (
              index < (index = visitToken(++index, [FPP.Keywords.high, FPP.Keywords.low], true))
            ) {
              break checkSeverity;
            }
          } else if (
            index <
            (index = visitToken(
              ++index,
              [FPP.Keywords.command, FPP.Keywords.diagnostic, FPP.Keywords.fatal],
              true
            ))
          ) {
            break checkSeverity;
          }
          console.log("Invalid Severity");
        }
      } else {
        console.log("Expected 'severity'.\tFound:\t", tokens[index]?.text);
      }
      if (index < (index = visitToken(++index, FPP.Keywords.id, true))) {
        if (index >= (index = visitExpression(++index))) {
          console.log("Invalid id expression\tCurrent Token:\t", tokens[index]?.text);
        }
      }
      if (index < (index = visitToken(++index, FPP.Keywords.format, true))) {
        index = visitString(++index);
      } else {
        console.log("Expected 'format'.\tFound:\t", tokens[index]?.text);
      }
      if (index < (index = visitToken(++index, FPP.Keywords.throttle, true))) {
        if (index >= (index = visitExpression(++index))) {
          console.log("Invalid throttle expression\tCurrent Token:\t", tokens[index]?.text);
        }
      }
      console.log("Leaving Event Specifier");
    }
    return index;
  }

  // Include Specifiers
  // Syntax:
  // include string-literal
  function visitIncludeSpec(index: number): number {
    console.log("Visiting Include Specifier\tNext Token:\t", tokens[index + 1]?.text);
    if (tokens[index]?.text === FPP.Keywords.include) {
      index = visitString(++index);
    }
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
    if (tokens[index]?.text === FPP.Keywords.internal) {
      if (index < (index = visitToken(++index, FPP.Keywords.port, true))) {
        index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PORT, [FPP.TokenType.DECLARATION]);
        index = visitParamList(++index);
        if (index < (index = visitToken(++index, FPP.Keywords.priority, true))) {
          console.log("Found priority expression");
          if (index >= (index = visitExpression(++index))) {
            console.log("Invalid priority expression\tCurrent Token:\t", tokens[index]?.text);
          }
        }
        if (
          index <
          (index = visitToken(
            ++index,
            [FPP.Keywords.assert, FPP.Keywords.block, FPP.Keywords.drop],
            true
          ))
        ) {
          console.log("Found queue-full-behavior adjective, '" + tokens[index]?.text + "'");
        }
      } else {
        console.log("Invalid internal port defition. Expected 'port'. Found ", tokens[index]?.text);
      }
    }
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
    // TODO
    return index;
  }

  // Parameter Specifiers
  // Syntax:
  // param identifier : type-name [ default expression ] [ id expression ] [ set opcode expression ] [ save opcode expression ]
  function visitParamSpec(index: number): number {
    console.log("Visiting Parameter Specifier\tNext Token:\t", tokens[index + 1]?.text);
    if (tokens[index]?.text === FPP.Keywords.param) {
      index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PARAM, [FPP.TokenType.DECLARATION]);
      index = visitType(++index);
      if (index < (index = visitToken(++index, FPP.Keywords.default, true))) {
        if (index >= (index = visitExpression(++index))) {
          console.log("Invalid default expression\tCurrent Token:\t", tokens[index]?.text);
        }
      }
      if (index < (index = visitToken(++index, FPP.Keywords.id, true))) {
        if (index >= (index = visitExpression(++index))) {
          console.log("Invalid id expression\tCurrent Token:\t", tokens[index]?.text);
        }
      }
      if (index < (index = visitToken(++index, FPP.Keywords.set, true))) {
        ParamSpecSet: {
          if (index < (index = visitToken(++index, FPP.Keywords.opcode, true))) {
            if (index >= (index = visitExpression(++index))) {
              break ParamSpecSet;
            }
          }
          console.log("Invalid set opcode expression\tCurrent Token:\t", tokens[index]?.text);
        }
      }
      if (index < (index = visitToken(++index, FPP.Keywords.save, true))) {
        ParamSpecsave: {
          if (index < (index = visitToken(++index, FPP.Keywords.opcode, true))) {
            if (index >= (index = visitExpression(++index))) {
              break ParamSpecsave;
            }
          }
          console.log("Invalid save opcode expression\tCurrent Token:\t", tokens[index]?.text);
        }
      }
      console.log("Leaving Parameter Specifier");
    }
    return index;
  }

  // Port Instance Specifiers
  // Syntax:
  // general-port-kind port identifier : [ [ expression ] ] port-instance-type [ priority expression ] [ queue-full-behavior ]
  // special-port-kind port identifier
  function visitPortInstanceSpec(index: number): number {
    console.log("Visiting Port Instance Specifier\tCurrent Token:\t", tokens[index].text);
    let generalPortKind = false;
    let check = index;
    switch (tokens[index].text) {
      case FPP.Keywords.async:
      case FPP.Keywords.guarded:
      case FPP.Keywords.sync:
        index = visitToken(++index, FPP.Keywords.input, true);
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
      case FPP.Keywords.output:
        generalPortKind = true;
      case FPP.Keywords.telemetry:
      case FPP.Keywords.event:
        break;
      default:
        // Error
        console.log("Error - invalid port kind");
        return check + 1;
    }
    if (check >= index) {
      // Error
      console.log("Error - invalid port kind");
      return check + 1;
    }
    index = visitToken(++index, FPP.Keywords.port, true);
    index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PORT, [FPP.TokenType.DECLARATION]);
    if (generalPortKind) {
      index = visitToken(++index, FPP.Operators.COLON, true);
      let visited = new Array<number>(5);
      let done = false;
      // TODO: Remove while loop
      while (!done) {
        index++;
        switch (tokens[index].text) {
          case FPP.Keywords.priority:
            if (!visited[0]) {
              index = visitExpression(++index);
            }
            break;
          case FPP.Operators.LBRACKET:
            index = visitExpression(++index);
            index = visitToken(++index, FPP.Operators.RBRACKET, true);
            break;
          case FPP.Keywords.assert:
          case FPP.Keywords.block:
          case FPP.Keywords.drop:
          case FPP.Keywords.serial:
            break;
          default:
            done = true;
            let a = tokens[index].text;
            if (identifiers.has(tokens[index].text)) {
              index = visitQualifiedIdentifier(index);
            } else {
              done = true;
            }
        }
      }
    }
    return index;
  }

  // Port Matching Specifiers
  // Syntax:
  // [ private ] instance qual-ident
  function visitPortMatchingSpec(index: number): number {
    console.log("Visiting Port Matching Specifier\tNext Token:\t", tokens[index + 1]?.text);
    // TODO
    return index;
  }

  // Telemetry Channel Specifiers
  // Syntax:
  // telemetry identifier : type-name [ id expression ] [ update telemetry-update ] [ format string-literal ]
  // [ low { telemetry-limit-sequence } ] [ high { telemetry-limit-sequence } ]
  function visitTelemetryChannelSpec(index: number): number {
    console.log("Visiting Telemetry Specifier\tNext Token:\t", tokens[index + 1]?.text);
    if (tokens[index]?.text === FPP.Keywords.telemetry) {
      index = visitIdentifierDef(++index, FPP.KeywordTokensMap.TOPOLOGY, [
        FPP.TokenType.DECLARATION,
      ]);
      if (tokens[++index]?.text !== FPP.Operators.COLON) {
        console.log("Invalid Telemetry. Expected ':' Found:\t", tokens[index]?.text);
      }
      index = visitType(++index);
      if (index < (index = visitToken(++index, FPP.Keywords.id, true))) {
        if (index >= (index = visitExpression(++index))) {
          console.log("Invalid id expression\tCurrent Token:\t", tokens[index]?.text);
        }
      }
      if (index < (index = visitToken(++index, FPP.Keywords.update, true))) {
        checkUpdate: {
          if (index < (index = visitToken(++index, FPP.Keywords.always, true))) {
            break checkUpdate;
          } else if (index < (index = visitToken(++index, FPP.Keywords.on, true))) {
            if (index < (index = visitToken(++index, FPP.Keywords.change, true))) {
              break checkUpdate;
            }
          }
          console.log("Invalid update modifers\tCurrent Token:\t", tokens[index]?.text);
        }
      }
      if (index < (index = visitToken(++index, FPP.Keywords.format, true))) {
        index = visitString(++index);
      }
      if (index < (index = visitToken(++index, FPP.Keywords.low, true))) {
        index = visitTelemetrySequence(++index);
      }
      if (index < (index = visitToken(++index, FPP.Keywords.high, true))) {
        index = visitTelemetrySequence(++index);
      }
    } else {
      // Error
    }
    return index;
  }

  // Topology Import Specifiers
  // Syntax:
  // import qual-ident
  // Note: qual-ident must refer to a topology definition
  function visitTopologyImportSpec(index: number): number {
    console.log("Visiting Topology Import Specifier\tCurrent Token:\t", tokens[index].text);

    if (tokens[index]?.text !== FPP.Keywords.import) {
      // Error
    }
    if (identifiers.has(tokens[index + 1].text)) {
      index = visitQualifiedIdentifier(++index);
    } else {
      // Error
      console.log("Qualified identifier must refer to a topology definition");
    }

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
      index = visitToken(++index, FPP.Operators.COMMA);
    }
    currentScope.pop();
    return index + 1;
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
          if (
            tokens[index + 1]?.text === FPP.Keywords.get ||
            tokens[index + 1]?.text === FPP.Keywords.set
          ) {
            index = visitPortInstanceSpec(index);
          } else {
            index = visitParamSpec(index);
          }
          break;
        // A command specifier
        case FPP.Keywords.async:
        case FPP.Keywords.guarded:
        case FPP.Keywords.sync:
          if (tokens[index + 1]?.text === FPP.Keywords.input) {
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
          if (tokens[index + 1]?.text === FPP.Keywords.port) {
            index = visitPortInstanceSpec(index);
          } else {
            index = visitTelemetryChannelSpec(index);
          }
          break;
        // An event specifier
        case FPP.Keywords.event:
          if (tokens[index + 1]?.text === FPP.Keywords.port) {
            index = visitPortInstanceSpec(index);
          } else {
            index = visitEventSpec(index);
          }
          break;
        // An include specifier
        case FPP.Keywords.include:
          index = visitIncludeSpec(index);
        // An internal port specifier
        case FPP.Keywords.internal:
          index = visitInternalPortSpec(index);
        default:
          // Error
          index++;
      }
    }
    currentScope.pop();
    return index;
  }

  // [ ref ] identifier : type-name
  function visitParamList(index: number): number {
    if (tokens[index]?.text === FPP.Operators.LPAREN) {
      console.log("Visiting Formal Parameter List");
      let validNext = true;
      if (++index < tokens.length) {
        do {
          if (FPP.Operators.RPAREN === tokens[index]?.text) {
            console.log("Leaving Formal Parameter List");
            return index;
          } else if (!validNext && tokens[index - 1].line === tokens[index].line) {
            console.log("Invalid Parameter Sequence\tCurrent Token:", tokens[index]?.text);
            return index;
          }
          if (index >= (index = visitParamDef(index)) || ++index >= tokens.length) {
            break;
          }
          if (FPP.Operators.SEMICOLON === tokens[index]?.text) {
            index++;
            validNext = true;
          } else {
            validNext = false;
          }
          if (tokens[index].tokenType === FPP.TokenType.ANNOTATION) {
            console.log("Has Annotation:\t\t\tCurrent Token:\t", tokens[++index]?.text);
          }
        } while (true);
      }
      console.log("Invalid exit of Parameter List\tCurrent Token:", tokens[index]?.text);
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
          index = visitComponentDef(index);
          break;
        case FPP.Keywords.instance:
          index = visitInstanceDef(index);
          break;
        case FPP.Keywords.constant:
          index = visitConstantDef(index);
          break;
        case FPP.Keywords.module:
          index = visitModuleDef(index);
          break;
        case FPP.Keywords.port:
          index = visitPortDef(index);
          break;
        case FPP.Keywords.struct:
          index = visitStructDef(index);
          break;
        case FPP.Keywords.topology:
          index = visitTopologyDef(index);
          break;
        case FPP.Keywords.locate:
          index = visitLocationSpec(index);
          break;
        case FPP.Keywords.type:
          index = visitType(index);
          break;
        case FPP.Keywords.array:
          index = visitArrayDef(index);
          break;
        case FPP.Keywords.enum:
          index = visitEnumDef(index);
          break;
        case FPP.Keywords.include:
          index = visitIncludeSpec(index);
          break;
        default:
          //Error
          index++;
      }
    }
    return index;
  }

  function visitStructMemberSequence(index: number): number {
    if (tokens[index]?.text === FPP.Operators.LBRACE) {
      console.log("Visiting Struct Type Member Sequence");
      let vaildNext = true;
      if (++index < tokens.length) {
        do {
          if (FPP.Operators.RBRACE === tokens[index]?.text) {
            console.log("Leaving Struct Member Sequence");
            return index;
          } else if (!vaildNext && tokens[index - 1].line === tokens[index].line) {
            console.log("Invaild Struct Member Sequence\tCurrent Token:", tokens[index]?.text);
            return index;
          }
          if (index >= (index = visitStructTypeMember(index)) || ++index >= tokens.length) {
            break;
          }
          if (FPP.Operators.COMMA === tokens[index]?.text) {
            index++;
            vaildNext = true;
          } else {
            vaildNext = false;
          }
        } while (true);
      }
      console.log("Invaild exit of Struct Member Sequence\tCurrent Token:", tokens[index]?.text);
    }
    return index;
  }

  function visitStructElementSequence(index: number): number {
    if (tokens[index]?.text === FPP.Operators.LBRACE) {
      console.log("Visiting Struct Element Sequence");
      // TODO
    }
    return ++index;
  }

  function visitTopologyMemberSequence(index: number): number {
    console.log("Visiting Topology Member Sequence\tNext Token:\t", tokens[++index].text);

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
      }
    }
    return index;
  }

  // For direct graph specifiers
  function visitConnectionSequence(index: number): number {
    console.log("Visiting Connection Sequence\tNext Token:\t", tokens[++index].text);

    while (++index < tokens.length && tokens[index].text !== FPP.Operators.RBRACE) {
      // port-instance-id [ [ expression ] ] -> port-instance-id [ [ expression ] ]
      // port instance id: qual-ident.identifier
      // qual-ident of port instance id must refer to a component instance
      // identifier must refer to a port instance specifier

      if (identifiers.has(tokens[index].text)) {
        index = visitQualifiedIdentifier(++index);
        index = visitToken(++index, FPP.Operators.DOT, true);
        index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PORT, [FPP.TokenType.DECLARATION]);
        index = visitToken(++index, FPP.Operators.RARROW, true);
        if (identifiers.has(tokens[++index].text)) {
          index = visitQualifiedIdentifier(index);
          index = visitToken(++index, FPP.Operators.DOT, true);
          index = visitIdentifierDef(++index, FPP.KeywordTokensMap.PORT, [
            FPP.TokenType.DECLARATION,
          ]);
        }
      } else {
        // Error
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

  // [ ref ] identifier : type-name
  function visitParamDef(index: number): number {
    console.log("Visiting Parameter identifier\tCurrent Token:\t", tokens[index]?.text);
    console.log(
      "Expecting Token(s):\t",
      FPP.Keywords.ref,
      "\tCurrent Token:\t",
      tokens[index].text
    );
    if (FPP.Keywords.ref === tokens[index].text) {
      index++;
    }
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
    if (index < (index = visitToken(++index, FPP.Operators.COLON, true))) {
      index = visitType(++index);
    }
    console.log("Exiting Parameter identifier");
    return index;
  }

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
    if (tokens[index + 1]?.text === FPP.Operators.LBRACKET) {
      index = visitExpression(index + 2);
      if (tokens[index + 1]?.text !== FPP.Operators.RBRACKET) {
        console.log("Invaild closed expression");
      }
      index++;
    }
    index = visitType(++index);
    if (tokens[index + 1]?.text === FPP.Keywords.format) {
      index = visitString(index + 2);
    }
    return index;
  }
}
