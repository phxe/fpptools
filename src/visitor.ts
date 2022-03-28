import * as FPP from "./constants";
import { Parser, tokens } from "./parser";

const identifiers = new Map<string, [string, FPP.TokenType, FPP.TokenType[]]>();
const currentScope: string[] = [""];

export module Visitor {
  export function visitDocument() {
    if (tokens.length === 0) {
      return -1;
    }
    let index = 0;
    while (index < tokens.length) {
      let curr = tokens[index].text;
      let next = tokens[index + 1]?.text;
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
        default:
        // Error
      }
      index++;
      currentScope.length = 0;
    }
    identifiers.clear();
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //---------------------------\\ G E N E R I C S //---------------------------\\
  //---------------------------------------------------------------------------\\

  function visitExpression(index: number): number {
    console.log("Visiting Expression\t\tCurrent Token:\t", tokens[index].text);
    if (tokens[index].text === FPP.Operators.LBRACKET) {
      index = visitArrayExpression(++index);
      return index;
    }
    while (
      tokens[index].text === FPP.Operators.MINUS ||
      tokens[index].text === FPP.Operators.PLUS ||
      tokens[index].text === FPP.Operators.MULT ||
      tokens[index].text === FPP.Operators.DIV ||
      tokens[index].text === FPP.SuppressionOperators.BSLASH ||
      Parser.isNumber(tokens[index].text)
    ) {
      if (tokens[index].text === FPP.Operators.LPAREN) {
        index = visitParenthesisExpression(++index);
        continue;
      }
      index++;
    }
    return index - 1;
  }

  function visitParenthesisExpression(index: number): number {
    console.log("Visiting Parenthesis Expression\tCurrent Token:\t", tokens[index].text);
    index = visitExpression(++index);
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

  function visitToken(index: number, expectedToken: any, required: boolean = false): number {
    if (index - 1 === (index = visitNewlineSupression(index))) {
      return index;
      // Error
    } else {
      console.log("Expecting Token(s):\t", expectedToken, "\tCurrent Token:\t", tokens[index].text);
      if (expectedToken.includes(tokens[index].text)) {
        return index;
      } else {
        if (required) {
          // Error
          return index - 1;
        } else {
        }
        return index;
      }
    }
  }

  function visitType(index: number): number {
    if (index - 1 === (index = visitNewlineSupression(index))) {
      return index;
      // Error
    } else {
      console.log("Visiting Type\t\t\tCurrent Token:\t", tokens[index].text);
      if (!FPP.isMember(tokens[index].text, FPP.Types) && !identifiers.has(tokens[index].text)) {
        // Error
      }
      return index;
    }
  }

  function visitString(index: number): number {
    if (index - 1 === (index = visitNewlineSupression(index))) {
      return index;
      // Error
    } else {
      console.log("Visiting String\t\t\tCurrent Token:\t", tokens[index].text);
      if (tokens[index].tokenType !== FPP.TokenType.STRING) {
        // Error
      }
      return index;
    }
  }

  function visitQualifiedIdentifier(
    index: number,
    type: FPP.TokenType,
    modifiers: FPP.TokenType[]
  ): number {
    return index;
  }

  function visitIdentifier(index: number, type: FPP.TokenType, modifiers: FPP.TokenType[]): number {
    if (index - 1 === (index = visitNewlineSupression(index))) {
      return index;
      // Error
    } else {
      tokens[index].tokenType = type;
      tokens[index].tokenModifiers = modifiers.slice();
      if (Parser.isIdentifier(tokens[index].text)) {
        if (identifiers.has(tokens[index].text)) {
          console.log("Identifier Found\t\tCurrent Token:\t", tokens[index].text);
          tokens[index].tokenType = identifiers.get(tokens[index].text)?.[1] as FPP.TokenType;
          tokens[index].tokenModifiers = identifiers.get(
            tokens[index].text
          )?.[2] as FPP.TokenType[];
        } else {
          console.log("New Identifier\t\t\tCurrent Token:\t", tokens[index].text);
          let i;
          if ((i = modifiers.findIndex((mod) => mod === FPP.TokenType.DECLARATION)) !== -1) {
            // fix stuff with members
            delete modifiers[i];
            identifiers.set(tokens[index].text, ["", type, modifiers.slice()]);
            currentScope.push(tokens[index].text);
          } else {
            identifiers.set(tokens[index].text, [
              currentScope[currentScope.length - 1],
              type,
              modifiers.slice(),
            ]);
          }
        }
      } else {
        console.log("Invalid Identifier\t\tCurrent Token:\t", tokens[index].text);
        // let thisLine = tokens[index].line;
        // while (tokens[index++].line === thisLine) {}
        // return index;
        // Error
      }
    }

    return index;
  }

  function visitNewlineSupression(index: number): number {
    if (
      tokens[index - 1]?.line !== tokens[index].line &&
      !FPP.isValue(tokens[index - 1].text, FPP.SuppressionOperators)
    ) {
      // Error
      return index - 1;
    }
    while (tokens[index].text === FPP.SuppressionOperators.BSLASH) {
      console.log("Skipping Newline Suppression\tCurrent Token:\t", tokens[index].text);
      index++;
    }
    return index;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //------------------------\\ D E F I N I T I O N S //------------------------\\
  //---------------------------------------------------------------------------\\

  // type identifier
  function visitTypeDef(index: number): number {
    console.log("Visiting Type Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifier(++index, FPP.KeywordTokensMap.TYPE, [
      FPP.TokenType.DECLARATION,
      FPP.TokenType.ABSTRACT,
    ]);
    return index;
  }

  // array identifier = [ expression ] type-name [ default expression ] [ format string-literal ]
  function visitArrayDef(index: number): number {
    console.log("Visiting Array Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifier(++index, FPP.KeywordTokensMap.ARRAY, [FPP.TokenType.DECLARATION]);
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
    // TODO
    return index;
  }

  // component-kind component identifier { component-member-sequence }
  function visitComponentDef(index: number): number {
    console.log("Visiting Component Definition\tNext Token:\t", tokens[index + 2]?.text);
    index = visitToken(
      ++index,
      [FPP.Keywords.active, FPP.Keywords.passive, FPP.Keywords.queued],
      true
    );
    index = visitToken(++index, FPP.Keywords.component, true);
    index = visitIdentifier(++index, FPP.KeywordTokensMap.COMPONENT, [FPP.TokenType.DECLARATION]);
    index = visitToken(++index, FPP.Operators.LBRACE, true);
    index = visitComponentMemberSequence(++index);
    return index;
  }

  // instance identifier : qual-ident base id expression [ at string-literal ] [ queue size expression ]
  // [ stack size expression ] [ priority expression ] [ cpu expression ] [ { init-specifier-sequence } ]
  function visitInstanceDef(index: number): number {
    console.log("Visiting Instance Definition\tNext Token:\t", tokens[index + 1]?.text);
    FPP.KeywordTokensMap.INSTANCE;
    // TODO
    return index;
  }
  // constant identifier = expression
  function visitConstantDef(index: number): number {
    console.log("Visiting Constant Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifier(++index, FPP.KeywordTokensMap.CONSTANT, [FPP.TokenType.DECLARATION, FPP.TokenType.READONLY]);
    if (++index === visitToken(index, FPP.Operators.EQ, true)) {
      index = visitExpression(++index);
    }
    // TODO
    return index;
  }

  // enum identifier [ : type-name ] { enum-constant-sequence } [ default expression ]
  function visitEnumDef(index: number): number {
    console.log("Visiting Enum Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifier(++index, FPP.KeywordTokensMap.ENUM, [FPP.TokenType.DECLARATION]);
    if (tokens[index + 1]?.text === FPP.Operators.COLON) {
      index = visitType(index + 2);
    }
    if (index < (index = visitToken(++index, FPP.Operators.LBRACE, true))) {
      index = visitEnumConstantSequence(index);
      if (tokens[index + 1]?.text === FPP.Keywords.default) {
        index = visitExpression(index + 2);
      }
    }
    return index;
  }

  // identifier [ = expression ]
  function visitEnumConstantDef(index: number): number {
    console.log("Visiting Enum Constant Def\tCurrent Token:\t", tokens[index].text);
    tokens[index].tokenType = FPP.TokenType.ENUMMEMBER;
    tokens[index].tokenModifiers = [FPP.TokenType.DECLARATION];
    if (Parser.isIdentifier(tokens[index].text)) {
      if (identifiers.has(tokens[index].text)) {
        console.log("Identifier Found\t\tCurrent Token:\t", tokens[index].text);
        tokens[index].tokenType = identifiers.get(tokens[index].text)?.[0] as FPP.TokenType;
        tokens[index].tokenModifiers = identifiers.get(tokens[index].text)?.[2] as FPP.TokenType[];
      } else {
        console.log("New Identifier\t\t\tCurrent Token:\t", tokens[index].text);
        identifiers.set(tokens[index].text, [tokens[index].text, FPP.TokenType.ENUMMEMBER, []]);
      }
    } else {
      console.log("Invalid Identifier\t\tCurrent Token:\t", tokens[index].text);
      // Error
      let thisLine = tokens[index].line;
      while (tokens[index++].line === thisLine) {}
      return index;
    }

    if (tokens[index + 1]?.text === FPP.Operators.EQ) {
      index = visitExpression(index + 2);
    }
    return index;
  }

  // module identifier { module-member-sequence }
  function visitModuleDef(index: number): number {
    console.log("Visiting Module Definition\tNext Token:\t", tokens[index + 1]?.text);
    FPP.KeywordTokensMap.MODULE;
    // TODO
    return index;
  }
  // port identifier [ ( param-list ) ] [ -> type-name ]
  function visitPortDef(index: number): number {
    console.log("Visiting Port Definition\tNext Token:\t", tokens[index + 1]?.text);
    index = visitIdentifier(++index, FPP.KeywordTokensMap.PORT, [FPP.TokenType.DECLARATION, FPP.TokenType.READONLY]);
    index = visitParamList(index);
    if (index === (index = visitToken(index, FPP.Operators.RARROW, true))) {
      index = visitType(++index);
    }
    // TODO
    return index;
  }
  // struct identifier { struct-type-member-sequence } [ default expression ]
  function visitStructDef(index: number): number {
    console.log("Visiting Struct Definition\tNext Token:\t", tokens[index + 1]?.text);
    FPP.KeywordTokensMap.STRUCT;
    // TODO
    return index;
  }
  // topology identifier { topology-member-sequence }
  function visitTopologyDef(index: number): number {
    console.log("Visiting Topology Definition\tNext Token:\t", tokens[index + 1]?.text);
    FPP.KeywordTokensMap.TOPOLOGY;
    // TODO
    return index;
  }

  // [ ref ] identifier : type-name
  function visitParamDef(index: number): {index: number, vaildNext: boolean} {
    console.log("Visiting Parameter identifier\tCurrent Token:\t", tokens[index]?.text);
    var vaildNext = false;
    console.log("Expecting Token(s):\t", FPP.Keywords.ref, "\tCurrent Token:\t", tokens[index].text);
    if (FPP.Keywords.ref.includes(tokens[index].text)) {
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
      return {index, vaildNext};
    }
    if (index < (index = visitToken(++index, FPP.Operators.COLON, true))) {
      index = visitType(++index);
    }
    if (FPP.Operators.SEMICOLON === tokens[index + 1]?.text) {
      ++index;
      vaildNext = true;
    }
    if (tokens[index + 1].tokenType === FPP.TokenType.ANNOTATION) {
      console.log("Has Annotation:\t\t\tCurrent Token:\t", tokens[++index]?.text);
    }
    console.log("Exiting Parameter identifier");
    return {index, vaildNext};
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //-------------------------\\ S P E C I F I E R S //-------------------------\\
  //---------------------------------------------------------------------------\\

  // command-kind command identifier [ ( param-list ) ] [ opcode expression ] [ priority expression ] [ queue-full-behavior ]
  function visitCommandSpec(index: number): number {
    console.log("Visiting Command Specifier\tNext Token:\t", tokens[index + 1]?.text);
    // TODO
    return index;
  }

  // param identifier : type-name [ default expression ] [ id expression ] [ set opcode expression ] [ save opcode expression ]
  function visitParamSpec(index: number): number {
    console.log("Visiting Parameter Specifier\tNext Token:\t", tokens[index + 1]?.text);
    // TODO
    return index;
  }

  // general-port-kind port identifier : [ [ expression ] ] port-instance-type [ priority expression ] [ queue-full-behavior ]
  // special-port-kind port identifier
  function visitPortInstanceSpec(index: number): number {
    console.log("Visiting Port Instance Specifier\tCurrent Token:\t", tokens[index].text);
    let generalPortKind = false;
    switch (tokens[index].text) {
      case FPP.Keywords.async:
      case FPP.Keywords.guarded:
      case FPP.Keywords.output:
      case FPP.Keywords.sync:
        index = visitGeneralPortKind(index);
        generalPortKind = true;
        break;
      case FPP.Keywords.command:
      case FPP.Keywords.event:
      case FPP.Keywords.param:
      case FPP.Keywords.text:
      case FPP.Keywords.time:
      case FPP.Keywords.telemetry:
        index = visitSpecialPortKind(index);
        break;
    }
    index = visitToken(++index, FPP.Keywords.port, true);
    index = visitIdentifier(++index, FPP.KeywordTokensMap.PORT, [FPP.TokenType.DECLARATION]);
    if (generalPortKind) {
      index = visitToken(++index, FPP.Operators.COLON, true);
      switch (tokens[index].text) {
        case FPP.Keywords.priority:
          index = visitExpression(++index);
          break;
        case FPP.Operators.LBRACKET:
          index = visitExpression(++index);
          index = visitToken(++index, FPP.Operators.RBRACKET, true);
          break;
        case FPP.Keywords.assert:
        case FPP.Keywords.block:
        case FPP.Keywords.drop:
        case FPP.Keywords.serial:
          index++;
        default:
          if (identifiers.has(tokens[index].text)) {
            // Visit qualified identifier
            index++;
          }
      }
    }
    return index;
  }

  // telemetry identifier : type-name [ id expression ] [ update telemetry-update ] [ format string-literal ]
  // [ low { telemetry-limit-sequence } ] [ high { telemetry-limit-sequence } ]
  function visitTelemetrySpec(index: number): number {
    console.log("Visiting Telemetry Specifier\tNext Token:\t", tokens[index + 1]?.text);
    // TODO
    return index;
  }

  // event identifier [ ( param-list ) ] severity severity [ id expression ] format string-literal [ throttle expression ]
  function visitEventSpec(index: number): number {
    console.log("Visiting Event Specifier\tNext Token:\t", tokens[index + 1]?.text);
    // TODO
    return index;
  }

  // include string-literal
  function visitIncludeSpec(index: number): number {
    console.log("Visiting Include Specifier\tNext Token:\t", tokens[index + 1]?.text);
    // TODO
    return index;
  }

  // internal port identifier [ ( param-list ) ] [ priority expression ] [ queue-full-behavior ]
  function visitInternalPortSpec(index: number): number {
    console.log("Visiting Internal Port Specifier\tNext Token:\t", tokens[index + 1]?.text);
    // TODO
    return index;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //--------------------------\\ S E Q U E N C E S //--------------------------\\
  //---------------------------------------------------------------------------\\

  function visitEnumConstantSequence(index: number): number {
    console.log("Visiting enum-constant-sequence\tNext Token:\t", tokens[index + 1]?.text);
    while (index < tokens.length && tokens[index + 1]?.text !== FPP.Operators.RBRACE) {
      index = visitEnumConstantDef(++index);
    }
    currentScope.pop();
    return index + 1;
  }

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
        case FPP.Keywords.event:
        case FPP.Keywords.text:
        case FPP.Keywords.time:
          index = visitPortInstanceSpec(index);
          break;
        // A telemetry channel specifier
        case FPP.Keywords.telemetry:
          if (tokens[index + 1]?.text === FPP.Keywords.port) {
            index = visitPortInstanceSpec(index);
          } else {
            index = visitTelemetrySpec(index);
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
        //Error
      }
      index++;
      // TODO
    }
    currentScope.pop();
    return index;
  }

    // List of Param identifiers
  function visitParamList(index: number): number {
    console.log("Visiting Formal Parameter List");
    var vaildNext = true;
    if (index < (index = visitToken(++index, FPP.Operators.LPAREN, true))) {
      while(index < tokens.length) {
        if (FPP.Operators.RPAREN === tokens[++index]?.text) {
          console.log("Leaving Formal Parameter List");
          return ++index;
        } else {
          if (!vaildNext && tokens[index - 1].line === tokens[index].line) {
              console.log("Invaild Parameter Sequence\tCurrent Token:", tokens[index]?.text);
              return index;
          }
        }
        if (index >= ({index, vaildNext} = visitParamDef(index)).index)
          {break;}
      }
      console.log("Invaild exit of Parameter List\tCurrent Token:", tokens[index]?.text);
    }
    return index;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //----------------------------\\ S P E C I A L //----------------------------\\
  //---------------------------------------------------------------------------\\

  function visitGeneralPortKind(index: number): number {
    console.log("Visiting General-Port-Kind\tCurrent Token:\t", tokens[index].text);
    switch (tokens[index].text) {
      case FPP.Keywords.async:
        index = visitToken(++index, FPP.Keywords.input, true);
        break;
      case FPP.Keywords.guarded:
        index = visitToken(++index, FPP.Keywords.input, true);
        break;
      case FPP.Keywords.sync:
        index = visitToken(++index, FPP.Keywords.input, true);
        break;
      case FPP.Keywords.output:
        index++;
        break;
    }
    return index;
  }

  function visitSpecialPortKind(index: number): number {
    console.log("Visiting Special-Port-Kind\tCurrent Token:\t", tokens[index].text);
    switch (tokens[index].text) {
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
    }
    return index;
  }
}
