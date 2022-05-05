import * as FPP from "./constants";
import { DiagnosticSeverity } from "vscode";
import { Diagnostics } from "./diagnostics";
import { ParsedToken } from "./token";
import { Parser } from "./parser";

export class Visitor {
  semanticTokens: ParsedToken[] = [];
  identifiers = new Map<string, [string, FPP.TokenType, FPP.ModifierType[]]>();
  tokens: ParsedToken[] = [];
  private currentScope: [string, FPP.TokenType][] = [["_GLOBAL_", FPP.TokenType.NIL]];
  private index: number = 0;

  constructor(parsed: ParsedToken[]) {
    this.tokens = parsed;
  }

  visitDocument() {
    this.identifiers.clear();
    while (this.index < this.tokens.length) {
      // prettier-ignore
      switch (this.tokens[this.index].text) {
        // Definitions
        case FPP.Keywords.array:    this.visitArrayDef(); break;
        case FPP.Keywords.active:
        case FPP.Keywords.passive:
        case FPP.Keywords.queued:   this.visitComponentDef(); break;
        case FPP.Keywords.constant: this.visitConstantDef(); break;
        case FPP.Keywords.instance: this.visitComponentInstanceDef(); break;
        case FPP.Keywords.enum:     this.visitEnumDef(); break;
        case FPP.Keywords.module:   this.visitModuleDef(); break;
        case FPP.Keywords.port:     this.visitPortDef(); break;
        case FPP.Keywords.struct:   this.visitStructDef(); break;
        case FPP.Keywords.type:     this.visitTypeDef(); break;
        case FPP.Keywords.topology: this.visitTopologyDef(); break;
        // Specifiers
        case FPP.Keywords.async:
        case FPP.Keywords.guarded:
        case FPP.Keywords.sync:
          if (this.lookAhead([FPP.Keywords.input], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitCommandSpec();
          }
          break;
        case FPP.Keywords.private:
        case FPP.Keywords.instance: this.visitComponentInstanceSpec(); break;
        case FPP.Keywords.connections:
        case FPP.Keywords.health:   this.visitConnectionGraphSpec(); break;
        case FPP.Keywords.include:  this.visitIncludeSpec(); break;
        case FPP.Keywords.phase:    this.visitInitSpec(); break;
        case FPP.Keywords.internal: this.visitInternalPortSpec(); break;
        case FPP.Keywords.locate:   this.visitLocationSpec(); break;
        case FPP.Keywords.text:
        case FPP.Keywords.output:   this.visitPortInstanceSpec(); break;
        case FPP.Keywords.match:    this.visitPortMatchingSpec(); break;
        case FPP.Keywords.import:   this.visitTopologyImportSpec(); break;
        case FPP.Keywords.event:
          if (this.lookAhead([FPP.Keywords.port], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitEventSpec();
          }
          break;
        case FPP.Keywords.param:
          if (this.lookAhead([FPP.Keywords.get], false) || this.lookAhead([FPP.Keywords.set], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitParamSpec();
          }
          break;
        case FPP.Keywords.command:
          if (this.lookAhead([FPP.Keywords.recv,FPP.Keywords.reg, FPP.Keywords.resp ], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitConnectionGraphSpec();
          }
          break;
        case FPP.Keywords.time:
          if (this.lookAhead([FPP.Keywords.get], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitConnectionGraphSpec();
          }
          break;
        case FPP.Keywords.telemetry:
          if (this.lookAhead([FPP.Keywords.port], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitTelemetryChannelSpec();
          }
          break;
        case FPP.Operators.BSLASH: break;
        default:
          switch (this.tokens[this.index].tokenType) {
            case FPP.TokenType.STRING:
            case FPP.TokenType.ANNOTATION:
              break;
            default:
              // Error
              Diagnostics.createFromToken(
                "Unexpected token: " + this.tokens[this.index].text,
                this.tokens[this.index],
                DiagnosticSeverity.Error
              );
          }
      }
      if (this.currentScope.length === 0) {
        this.currentScope.push(["", FPP.TokenType.NIL]);
      }
      if (this.currentScope.length !== 1) {
        console.log("Resetting Scope\t\tCurrent Token:\t", this.tokens[this.index].text);
        this.currentScope.length = 1;
      }
      this.nextIndex();
    }
    // Revisit symbols
  }

  private nextLineIndex() {
    let thisLine = this.tokens[this.index].line;
    while (this.index++ < this.tokens.length && this.tokens[this.index]?.line === thisLine) {}
  }

  private nextIndex() {
    this.index++;
    this.ignoreNonsemanticTokens();
  }

  private ignoreNonsemanticTokens() {
    while (
      this.index < this.tokens.length &&
      (this.tokens[this.index].tokenType === FPP.TokenType.ANNOTATION || this.tokens[this.index].text === FPP.Operators.BSLASH)
    ) {
      console.log("(" + this.index + ")\t", "Skipping Nonsemantic Token\tCurrent Token:\t", this.tokens[this.index].text);
      this.index++;
    }
    if (this.index >= this.tokens.length) {
      if (this.currentScope.length === 0) {
        this.currentScope.push(["", FPP.TokenType.NIL]);
      }
      throw FPP.eof;
    }
  }

  private lookAhead(str: string[], jump: boolean = true): boolean {
    let tmpIndex = this.index + 1;
    while (
      tmpIndex < this.tokens.length &&
      (this.tokens[tmpIndex].tokenType === FPP.TokenType.ANNOTATION || this.tokens[tmpIndex].text === FPP.Operators.BSLASH)
    ) {
      tmpIndex++;
    }
    if (str.includes(this.tokens[tmpIndex]?.text)) {
      if (jump) {
        this.index = tmpIndex;
      }
      return true;
    } else {
      return false;
    }
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //---------------------------\\ G E N E R I C S //---------------------------\\
  //---------------------------------------------------------------------------\\

  private visitToken(expectedToken: any, required: boolean) {
    this.nextIndex();
    console.log("(" + this.index + ")\t", "Expecting Token(s):\t", expectedToken, "\tFound Token:\t", this.tokens[this.index].text);
    if (!expectedToken.includes(this.tokens[this.index].text)) {
      if (required) {
        let thisLine = this.tokens[this.index].line;
        let i = this.index;
        // Look for token on the rest of the line
        while (i < this.tokens.length && this.tokens[i]?.line === thisLine) {
          if (expectedToken.includes(this.tokens[i].text)) {
            // Error
            Diagnostics.createFromToken(
              "Expected: " + expectedToken + "\nFound: " + this.tokens[this.index].text,
              this.tokens[this.index],
              DiagnosticSeverity.Error
            );
            console.log("(" + this.index + ")\t", "Located Token:\t\t" + this.tokens[i].text + "\tJumping Index To", i);
            this.index = i;
            return;
          } else {
            i++;
          }
        }
        // Error
        Diagnostics.createFromToken(
          "Expected: " + expectedToken + "\nFound: " + this.tokens[this.index].text,
          this.tokens[this.index],
          DiagnosticSeverity.Error
        );
      } else {
        this.index--;
      }
    }
  }

  private visitType() {
    this.nextIndex();
    console.log("(" + this.index + ")\t", "Visiting Type\t\t\tFound Token:\t", this.tokens[this.index].text);
    if (FPP.isMember(this.tokens[this.index].text, FPP.Types)) {
      if (this.tokens[this.index].text === FPP.Keywords.string && this.lookAhead([FPP.Keywords.size])) {
        this.visitExpression();
      }
    } else if (Parser.isIdentifier(this.tokens[this.index].text)) {
      this.index--;
      this.visitQualifiedIdentifier();
    } else {
      // Error
      Diagnostics.createFromToken("Invalid type: " + this.tokens[this.index].text, this.tokens[this.index], DiagnosticSeverity.Error);
    }
  }

  // TODO: Make visitTokenType
  private visitString() {
    this.nextIndex();
    console.log("(" + this.index + ")\t", "Visiting String\t\tFound Token:\t", this.tokens[this.index].text);
    if (this.tokens[this.index].tokenType === FPP.TokenType.STRING) {
      while (this.tokens[this.index + 1]?.tokenType === FPP.TokenType.STRING) {
        this.index++;
      }
    } else {
      // Error
      Diagnostics.createFromToken(
        "String expected\nFound: " + this.tokens[this.index].text,
        this.tokens[this.index],
        DiagnosticSeverity.Error
      );
    }
  }

  //------------------------\\ E X P R E S S I O N S //------------------------\\

  private visitExpression() {
    this.nextIndex();
    console.log("(" + this.index + ")\t", "Visiting Expression\t\tFound Token:\t", this.tokens[this.index].text);
    switch (this.tokens[this.index].text) {
      case FPP.Operators.MINUS:
        this.visitExpression();
        return;
      case FPP.Operators.LPAREN:
        this.visitParenthesisExpression();
        return;
      case FPP.Operators.LBRACKET:
        this.visitArrayExpression();
        return;
      default:
        if (this.tokens[this.index].tokenType === FPP.TokenType.STRING) {
          while (this.tokens[this.index + 1]?.tokenType === FPP.TokenType.STRING) {
            this.index++;
          }
          return;
        }
        if (Parser.isIdentifier(this.tokens[this.index].text)) {
          this.index--;
          this.visitQualifiedIdentifier();
        } else if (this.tokens[this.index].tokenType === FPP.TokenType.NUMBER) {
        } else {
          // Error
          Diagnostics.createFromToken(
            "Invalid expression: " + this.tokens[this.index].text,
            this.tokens[this.index],
            DiagnosticSeverity.Error
          );
        }
    }

    if (this.lookAhead([FPP.Operators.MINUS, FPP.Operators.PLUS, FPP.Operators.MULT, FPP.Operators.DIV])) {
      this.visitExpression();
    }
  }

  private visitParenthesisExpression() {
    console.log("(" + this.index + ")\t", "Visiting Parenthesis Expression\tCurrent Token:\t", this.tokens[this.index].text);
    this.nextIndex();
    this.visitExpression();
    this.visitToken(FPP.Operators.RPAREN, true);
  }

  private visitArrayExpression() {
    console.log("(" + this.index + ")\t", "Visiting Array Expression\tCurrent Token:\t", this.tokens[this.index].text);
    this.visitExpression();
    while (!this.lookAhead([FPP.Operators.RBRACKET])) {
      this.visitToken(FPP.Operators.COMMA, true);
      this.visitExpression();
    }
  }

  //------------------------\\ I D E N T I F I E R S //------------------------\\

  // TODO: Implement checking for qual-ident of a certain type
  private visitQualifiedIdentifier() {
    console.log("(" + this.index + ")\t", "Visiting Qualified Identifier\tCurrent Token:\t", this.tokens[this.index].text);
    this.visitIdentifier();
    while (this.lookAhead([FPP.Operators.DOT])) {
      this.visitIdentifier();
    }
  }

  private visitIdentifier() {
    this.nextIndex();
    // TODO: Check for qual-ident
    if (this.identifiers.has(this.tokens[this.index].text)) {
      console.log("(" + this.index + ")\t", "Identifier Found\t\tCurrent Token:\t", this.tokens[this.index].text);
      this.semanticTokens.push({
        line: this.tokens[this.index].line,
        startCharacter: this.tokens[this.index].startCharacter,
        length: this.tokens[this.index].length,
        tokenType: this.identifiers.get(this.tokens[this.index].text)?.[1] as FPP.TokenType,
        tokenModifiers: this.identifiers.get(this.tokens[this.index].text)?.[2] as FPP.ModifierType[],
        text: this.tokens[this.index].text,
      });
      // Remove later
      this.tokens[this.index].tokenType = this.identifiers.get(this.tokens[this.index].text)?.[1] as FPP.TokenType;
      this.tokens[this.index].tokenModifiers = this.identifiers.get(this.tokens[this.index].text)?.[2] as FPP.ModifierType[];
    } else if (!Parser.isIdentifier(this.tokens[this.index].text)) {
      console.log("(" + this.index + ")\t", "Invalid Identifier\t\tCurrent Token:\t", this.tokens[this.index].text);
      Diagnostics.createFromToken("Invalid Identifier: " + this.tokens[this.index].text, this.tokens[this.index], DiagnosticSeverity.Error);
    } else {
      // Error
      console.log("(" + this.index + ")\t", "Unknown Identifier\t\tCurrent Token:\t", this.tokens[this.index].text);
      // TODO: Add after reimplementation
      // Diagnostics.createFromToken("Unknown identifier: " + this.tokens[this.index].text, this.tokens[this.index], DiagnosticSeverity.Error);
    }
  }

  private visitIdentifierDef(type: FPP.TokenType, modifiers: FPP.ModifierType[]) {
    this.nextIndex();
    if (Parser.isIdentifier(this.tokens[this.index].text)) {
      if (
        this.identifiers.has(this.tokens[this.index].text) &&
        this.identifiers.get(this.tokens[this.index].text)?.[0] === this.currentScope[this.currentScope.length - 1][0]
      ) {
        // Error
        console.log("(" + this.index + ")\t", "Duplicate Identifier\t\tCurrent Token:\t", this.tokens[this.index].text);
        // Diagnostics.createFromToken(
        //   "Cannot redeclare variable: " + this.tokens[this.index].text,
        //   this.tokens[this.index],
        //   DiagnosticSeverity.Error
        // );
      } else {
        console.log("(" + this.index + ")\t", "New Identifier\t\t\tCurrent Token:\t", this.tokens[this.index].text);
        this.tokens[this.index].tokenType = type;
        this.tokens[this.index].tokenModifiers = modifiers.slice();
        let i;
        if ((i = modifiers.findIndex((mod) => mod === FPP.ModifierType.DECLARATION)) !== -1) {
          delete modifiers[i];
          this.identifiers.set(this.tokens[this.index].text, [this.currentScope[this.currentScope.length - 1][0], type, modifiers.slice()]);
          switch (this.tokens[this.index].tokenType) {
            // case FPP.TokenType.SPECIFIER:
            case FPP.TokenType.ENUM:
            case FPP.TokenType.COMPONENT:
            case FPP.TokenType.NAMESPACE:
            case FPP.TokenType.INSTANCE:
            case FPP.TokenType.STRUCT:
            case FPP.TokenType.TOPOLOGY:
              console.log("(" + this.index + ")\t", "New Scope\t\t\tCurrent Token:\t", this.tokens[this.index].text);
              this.currentScope.push([this.tokens[this.index].text, this.tokens[this.index].tokenType]);
            default:
              break;
          }
        } else {
          this.identifiers.set(this.tokens[this.index].text, [this.currentScope[this.currentScope.length - 1][0], type, modifiers.slice()]);
        }

        this.semanticTokens.push(this.tokens[this.index]);
      }
    } else {
      // Error
      console.log("(" + this.index + ")\t", "Invalid Identifier\t\tCurrent Token:\t", this.tokens[this.index].text);
      Diagnostics.createFromToken("Invalid Identifier: " + this.tokens[this.index].text, this.tokens[this.index], DiagnosticSeverity.Error);
    }
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //------------------------\\ D E F I N I T I O N S //------------------------\\
  //---------------------------------------------------------------------------\\

  // Abstract Type Definitions
  // Syntax:
  // type identifier
  private visitTypeDef() {
    console.log("(" + this.index + ")\t", "Visiting Type Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.TYPE, [FPP.ModifierType.DECLARATION, FPP.ModifierType.ABSTRACT]);
  }

  // Array Definitions
  // Syntax:
  // array identifier = [ expression ] type-name [ default expression ] [ format string-literal ]
  private visitArrayDef() {
    console.log("(" + this.index + ")\t", "Visiting Array Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.ARRAY, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.EQ, true);
    this.visitToken(FPP.Operators.LBRACKET, true);
    this.visitExpression();
    this.visitToken(FPP.Operators.RBRACKET, true);
    this.visitType();
    if (this.lookAhead([FPP.Keywords.default])) {
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.format])) {
      this.visitString();
    }
  }

  // Component Definitions
  // Syntax:
  // component-kind component identifier { component-member-sequence }
  private visitComponentDef() {
    console.log("(" + this.index + ")\t", "Visiting Component Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitToken(FPP.Keywords.component, true);
    this.visitIdentifierDef(FPP.KeywordTokensMap.COMPONENT, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.LBRACE, true);
    this.visitComponentMemberSequence();
  }

  // Component Instance Definitions
  // Syntax:
  // instance identifier : qual-ident base id expression [ at string-literal ] [ queue size expression ]
  // [ stack size expression ] [ priority expression ] [ cpu expression ] [ { init-specifier-sequence } ]
  private visitComponentInstanceDef() {
    console.log("(" + this.index + ")\t", "Visiting Instance Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.INSTANCE, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.COLON, true);
    this.visitQualifiedIdentifier();
    this.visitToken(FPP.Keywords.base, true);
    this.visitToken(FPP.Keywords.id, true);
    this.visitExpression();
    if (this.lookAhead([FPP.Keywords.at])) {
      this.visitString();
    }
    if (this.lookAhead([FPP.Keywords.queue])) {
      this.visitToken(FPP.Keywords.size, true);
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.stack])) {
      this.visitToken(FPP.Keywords.size, true);
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.priority])) {
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.cpu])) {
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Operators.LBRACE])) {
      this.visitInitSpecSequence();
    }
  }

  // Constant Definitions
  // Syntax:
  // constant identifier = expression
  private visitConstantDef() {
    console.log("(" + this.index + ")\t", "Visiting Constant Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.CONSTANT, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.EQ, true);
    this.visitExpression();
  }

  // Enum Definitions
  // Syntax:
  // enum identifier [ : type-name ] { enum-constant-sequence } [ default expression ]
  private visitEnumDef() {
    console.log("(" + this.index + ")\t", "Visiting Enum Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.ENUM, [FPP.ModifierType.DECLARATION]);
    if (this.lookAhead([FPP.Operators.COLON])) {
      this.visitType();
    }
    this.visitToken(FPP.Operators.LBRACE, true);
    this.visitEnumConstantSequence();
    if (this.lookAhead([FPP.Keywords.default])) {
      this.visitExpression();
    }
  }

  // Enumerated Constant Definitions
  // Syntax:
  // identifier [ = expression ]
  private visitEnumConstantDef() {
    console.log("(" + this.index + ")\t", "Visiting Enum Constant Def\tCurrent Token:\t", this.tokens[this.index].text);
    this.index--;
    this.visitIdentifierDef(FPP.KeywordTokensMap.ENUMMEMBER, [FPP.ModifierType.DECLARATION]);
    if (this.lookAhead([FPP.Operators.EQ])) {
      this.visitExpression();
    }
  }

  // Module Definitions
  // Syntax:
  // module identifier { module-member-sequence }
  private visitModuleDef() {
    console.log("(" + this.index + ")\t", "Visiting Module Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.MODULE, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.LBRACE, true);
    this.visitModuleMemberSequence();
  }

  // Port Definitions
  // Syntax:
  // port identifier [ ( param-list ) ] [ -> type-name ]
  private visitPortDef() {
    console.log("(" + this.index + ")\t", "Visiting Port Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.PORT, [FPP.ModifierType.DECLARATION]);
    if (this.lookAhead([FPP.Operators.LPAREN])) {
      this.visitParamList();
    }
    if (this.lookAhead([FPP.Operators.RARROW])) {
      this.visitType();
    }
  }

  // Struct Definitions
  // Syntax:
  // struct identifier { struct-type-member-sequence } [ default expression ]
  private visitStructDef() {
    console.log("(" + this.index + ")\t", "Visiting Struct Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.STRUCT, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.LBRACE, true);
    this.visitStructTypeMemberSequence();
    if (this.lookAhead([FPP.Keywords.default])) {
      this.visitExpression();
    }
  }

  // Struct Member Definitions
  // Syntax:
  // identifier : [ [ expression ] ] type-name [ format string-literal ]
  private visitStructTypeMemberDef() {
    console.log("(" + this.index + ")\t", "Visiting Struct Type Member\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.index--;
    this.visitIdentifierDef(FPP.KeywordTokensMap.STRUCTMEMBER, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.COLON, true);
    if (this.lookAhead([FPP.Operators.LBRACKET])) {
      this.visitExpression();
    }
    this.visitType();
    if (this.lookAhead([FPP.Keywords.format])) {
      this.visitString();
    }
  }

  // Topology Definitions
  // Syntax:
  // topology identifier { topology-member-sequence }
  private visitTopologyDef() {
    console.log("(" + this.index + ")\t", "Visiting Topology Definition\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.TOPOLOGY, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.LBRACE, true);
    this.visitTopologyMemberSequence();
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //-------------------------\\ S P E C I F I E R S //-------------------------\\
  //---------------------------------------------------------------------------\\

  // Command Specifiers
  // Syntax:
  // command-kind command identifier [ ( param-list ) ] [ opcode expression ] [ priority expression ] [ queue-full-behavior ]
  private visitCommandSpec() {
    console.log("(" + this.index + ")\t", "Visiting Command Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    let queueFullSpec = false;
    if (this.tokens[this.index].text === FPP.Keywords.async) {
      queueFullSpec = true;
    }
    this.visitToken(FPP.Keywords.command, true);
    this.visitIdentifierDef(FPP.KeywordTokensMap.SPECIFIER, [FPP.ModifierType.DECLARATION]);
    if (this.lookAhead([FPP.Operators.LPAREN])) {
      this.visitParamList();
    }
    if (this.lookAhead([FPP.Keywords.opcode])) {
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.priority])) {
      this.visitExpression();
    }
    if (queueFullSpec) {
      this.visitToken([FPP.Keywords.assert, FPP.Keywords.block, FPP.Keywords.drop], false);
    }
  }

  // Component Instance Specifiers
  // Syntax:
  // [ private ] instance qual-ident
  // Note: qual-ident must refer to a component instance
  private visitComponentInstanceSpec() {
    console.log("(" + this.index + ")\t", "Visiting Component Instance Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    if (this.tokens[this.index].text !== FPP.Keywords.instance) {
      this.visitToken(FPP.Keywords.instance, true);
    }
    this.visitQualifiedIdentifier();
  }

  // Connection Graph Specifiers
  // Syntax:
  // connections identifier { connection-sequence }
  // pattern-kind connections instance qual-ident [ { instance-sequence } ]
  // Note: qual-ident must refer to a component instance that is available in the enclosing topology
  private visitConnectionGraphSpec() {
    console.log("(" + this.index + ")\t", "Visiting Connection Graph Specifier\tCurrent Token:\t", this.tokens[this.index].text);
    if (this.tokens[this.index].text === FPP.Keywords.connections) {
      this.visitIdentifierDef(FPP.KeywordTokensMap.SPECIFIER, [FPP.ModifierType.DECLARATION]);
      this.visitToken(FPP.Operators.LBRACE, true);
      this.visitConnectionSequence();
    } else {
      this.visitToken(FPP.Keywords.connections, true);
      this.visitToken(FPP.Keywords.instance, true);
      this.visitQualifiedIdentifier();
      if (this.lookAhead([FPP.Operators.LBRACE])) {
        this.visitInstanceSequence();
      }
    }
  }

  // Event Specifiers
  // Syntax:
  // event identifier [ ( param-list ) ] severity severity [ id expression ] format string-literal [ throttle expression ]
  private visitEventSpec() {
    console.log("(" + this.index + ")\t", "Visiting Event Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.SPECIFIER, [FPP.ModifierType.DECLARATION]);
    if (this.lookAhead([FPP.Operators.LPAREN])) {
      this.visitParamList();
    }
    this.visitToken(FPP.Keywords.severity, true);
    if (this.lookAhead([FPP.Keywords.activity]) || this.lookAhead([FPP.Keywords.warning])) {
      this.visitToken([FPP.Keywords.high, FPP.Keywords.low], true);
    } else {
      this.visitToken([FPP.Keywords.command, FPP.Keywords.diagnostic, FPP.Keywords.fatal], true);
    }
    if (this.lookAhead([FPP.Keywords.id])) {
      this.visitExpression();
    }
    this.visitToken(FPP.Keywords.format, true);
    this.visitString();
    if (this.lookAhead([FPP.Keywords.throttle])) {
      this.visitExpression();
    }
  }

  // Include Specifiers
  // Syntax:
  // include string-literal
  private visitIncludeSpec() {
    console.log("(" + this.index + ")\t", "Visiting Include Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitString();
  }

  // Init Specifiers
  // Syntax:
  // phase expression string-literal
  private visitInitSpec() {
    console.log("(" + this.index + ")\t", "Visiting Init Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitExpression();
    this.visitString();
  }

  // Internal Port Specifiers
  // Syntax:
  // internal port identifier [ ( param-list ) ] [ priority expression ] [ queue-full-behavior ]
  private visitInternalPortSpec() {
    console.log("(" + this.index + ")\t", "Visiting Internal Port Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitToken(FPP.Keywords.port, true);
    this.visitIdentifierDef(FPP.KeywordTokensMap.SPECIFIER, [FPP.ModifierType.DECLARATION]);
    if (this.lookAhead([FPP.Operators.LPAREN])) {
      this.visitParamList();
    }
    if (this.lookAhead([FPP.Keywords.priority])) {
      this.visitExpression();
    }
    this.visitToken([FPP.Keywords.assert, FPP.Keywords.block, FPP.Keywords.drop], false);
  }

  // Location Specifiers
  // Syntax:
  // locate instance qual-ident at string-literal
  // locate component qual-ident at string-literal
  // locate constant qual-ident at string-literal
  // locate port qual-ident at string-literal
  // locate topology qual-ident at string-literal
  // locate type qual-ident at string-literal
  private visitLocationSpec() {
    console.log("(" + this.index + ")\t", "Visiting Location Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitToken(
      [FPP.Keywords.instance, FPP.Keywords.component, FPP.Keywords.constant, FPP.Keywords.port, FPP.Keywords.topology, FPP.Keywords.type],
      true
    );
    this.visitQualifiedIdentifier();
    this.visitToken(FPP.Keywords.at, true);
    this.visitString();
  }

  // Parameter Specifiers
  // Syntax:
  // param identifier : type-name [ default expression ] [ id expression ] [ set opcode expression ] [ save opcode expression ]
  private visitParamSpec() {
    console.log("(" + this.index + ")\t", "Visiting Parameter Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.SPECIFIER, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.COLON, true);
    this.visitType();
    if (this.lookAhead([FPP.Keywords.default])) {
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.id])) {
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.set])) {
      this.visitToken(FPP.Keywords.opcode, true);
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.save])) {
      this.visitToken(FPP.Keywords.opcode, true);
      this.visitExpression();
    }
  }

  // Port Instance Specifiers
  // Syntax:
  // general-port-kind port identifier : [ [ expression ] ] port-instance-type [ priority expression ] [ queue-full-behavior ]
  // special-port-kind port identifier
  private visitPortInstanceSpec() {
    console.log("(" + this.index + ")\t", "Visiting Port Instance Specifier\tCurrent Token:\t", this.tokens[this.index].text);
    let queueFullSpec = false;
    let generalPortKind = false;
    switch (this.tokens[this.index].text) {
      case FPP.Keywords.async:
        queueFullSpec = true;
      case FPP.Keywords.guarded:
      case FPP.Keywords.sync:
        this.visitToken(FPP.Keywords.input, true);
        generalPortKind = true;
        break;
      case FPP.Keywords.output:
        generalPortKind = true;
        break;
      case FPP.Keywords.command:
        this.visitToken([FPP.Keywords.recv, FPP.Keywords.reg, FPP.Keywords.resp], true);
        break;
      case FPP.Keywords.param:
        this.visitToken([FPP.Keywords.set, FPP.Keywords.get], true);
        break;
      case FPP.Keywords.text:
        this.visitToken(FPP.Keywords.event, true);
        break;
      case FPP.Keywords.time:
        this.visitToken(FPP.Keywords.get, true);
        break;
      case FPP.Keywords.telemetry:
      case FPP.Keywords.event:
        break;
      default:
      // Error
    }
    this.visitToken(FPP.Keywords.port, true);
    this.visitIdentifierDef(FPP.KeywordTokensMap.PORT, [FPP.ModifierType.DECLARATION]);
    if (generalPortKind) {
      this.visitToken(FPP.Operators.COLON, true);
      if (this.lookAhead([FPP.Operators.LBRACKET])) {
        this.visitExpression();
        this.visitToken(FPP.Operators.RBRACKET, true);
      }
      if (!this.lookAhead([FPP.Keywords.serial])) {
        this.visitQualifiedIdentifier();
      }
      if (this.lookAhead([FPP.Keywords.priority])) {
        this.visitExpression();
      }
      if (queueFullSpec) {
        this.visitToken([FPP.Keywords.assert, FPP.Keywords.block, FPP.Keywords.drop], false);
      }
    }
  }

  // Port Matching Specifiers
  // Syntax:
  // match identifier with identifier
  private visitPortMatchingSpec() {
    console.log("(" + this.index + ")\t", "Visiting Port Matching Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifier();
    this.visitToken(FPP.Keywords.with, true);
    this.visitIdentifier();
  }

  // Telemetry Channel Specifiers
  // Syntax:
  // telemetry identifier : type-name [ id expression ] [ update telemetry-update ] [ format string-literal ]
  // [ low { telemetry-limit-sequence } ] [ high { telemetry-limit-sequence } ]
  private visitTelemetryChannelSpec() {
    console.log("(" + this.index + ")\t", "Visiting Telemetry Specifier\tCurrent Token:\t", this.tokens[this.index]?.text);
    this.visitIdentifierDef(FPP.KeywordTokensMap.SPECIFIER, [FPP.ModifierType.DECLARATION]);
    this.visitToken(FPP.Operators.COLON, true);
    this.visitType();
    if (this.lookAhead([FPP.Keywords.id])) {
      this.visitExpression();
    }
    if (this.lookAhead([FPP.Keywords.update])) {
      if (this.lookAhead([FPP.Keywords.always])) {
      } else if (this.lookAhead([FPP.Keywords.on])) {
        this.visitToken(FPP.Keywords.change, true);
      }
    }
    if (this.lookAhead([FPP.Keywords.format])) {
      this.visitString();
    }
    if (this.lookAhead([FPP.Keywords.low])) {
      this.visitToken(FPP.Operators.LBRACE, true);
      this.visitTelemetryLimitSequence();
    }
    if (this.lookAhead([FPP.Keywords.high])) {
      this.visitToken(FPP.Operators.LBRACE, true);
      this.visitTelemetryLimitSequence();
    }
  }

  // Topology Import Specifiers
  // Syntax:
  // import qual-ident
  // Note: qual-ident must refer to a topology definition
  private visitTopologyImportSpec() {
    console.log("(" + this.index + ")\t", "Visiting Topology Import Specifier\tCurrent Token:\t", this.tokens[this.index].text);
    this.visitQualifiedIdentifier();
    return;
  }

  //---------------------------------------------------------------------------\\
  //------------------------------\\ V I S I T //------------------------------\\
  //--------------------------\\ S E Q U E N C E S //--------------------------\\
  //---------------------------------------------------------------------------\\

  // Enum Constant Sequence
  // For enum definitions
  private visitEnumConstantSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      this.nextIndex();
      console.log("(" + this.index + ")\t", "Inside enum-constant-sequence\tCurrent Token:\t", this.tokens[this.index]?.text);
      this.visitEnumConstantDef();
      this.visitToken(FPP.Operators.COMMA, false);
    }
    this.currentScope.pop();
  }

  // Component Member Sequence
  // For component definitions
  private visitComponentMemberSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      this.nextIndex();
      console.log("(" + this.index + ")\t", "Inside component-member-seq\tCurrent Token:\t", this.tokens[this.index].text);
      switch (this.tokens[this.index].text) {
        // An array definition
        case FPP.Keywords.array:
          this.visitArrayDef();
          break;
        // A constant definition
        case FPP.Keywords.constant:
          this.visitConstantDef();
          break;
        // An enum definition
        case FPP.Keywords.enum:
          this.visitEnumDef();
          break;
        // A struct definition
        case FPP.Keywords.struct:
          this.visitStructDef();
          break;
        // An abstract type definition
        case FPP.Keywords.type:
          this.visitTypeDef();
          break;
        // A parameter specifier
        case FPP.Keywords.param:
          if (this.lookAhead([FPP.Keywords.get], false) || this.lookAhead([FPP.Keywords.set], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitParamSpec();
          }
          break;
        // A command specifier
        case FPP.Keywords.async:
        case FPP.Keywords.guarded:
        case FPP.Keywords.sync:
          if (this.lookAhead([FPP.Keywords.input], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitCommandSpec();
          }
          break;
        // A port instance specifier
        case FPP.Keywords.output:
          this.visitPortInstanceSpec();
          break;
        case FPP.Keywords.command:
        case FPP.Keywords.text:
        case FPP.Keywords.time:
          this.visitPortInstanceSpec();
          break;
        // A telemetry channel specifier
        case FPP.Keywords.telemetry:
          if (this.lookAhead([FPP.Keywords.port], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitTelemetryChannelSpec();
          }
          break;
        // An event specifier
        case FPP.Keywords.event:
          if (this.lookAhead([FPP.Keywords.port], false)) {
            this.visitPortInstanceSpec();
          } else {
            this.visitEventSpec();
          }
          break;
        // An include specifier
        case FPP.Keywords.include:
          this.visitIncludeSpec();
          break;
        // An internal port specifier
        case FPP.Keywords.internal:
          this.visitInternalPortSpec();
          break;
        // A port matching specifier
        case FPP.Keywords.match:
          this.visitPortMatchingSpec();
          break;
        default:
        // Error
      }
    }
    this.currentScope.pop();
  }

  // Parameter List (Sequence)
  // For port definitions, command specifiers, event specifiers and internal port specifiers
  // Syntax:
  // [ ref ] identifier : type-name
  private visitParamList() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RPAREN])) {
      console.log("(" + this.index + ")\t", "Inside param-list\tCurrent Token:\t", this.tokens[this.index].text);
      this.visitToken(FPP.Keywords.ref, false);
      this.visitIdentifierDef(FPP.TokenType.PARAMETER, [FPP.ModifierType.DECLARATION]);
      this.visitToken(FPP.Operators.COLON, true);
      this.visitType();
    }
  }

  // Telemetry Limit Sequence
  // For telemetry channel definitions
  private visitTelemetryLimitSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      console.log("(" + this.index + ")\t", "Inside telemetry-limit-sequence\tCurrent Token:\t", this.tokens[this.index].text);
      this.visitToken([FPP.Keywords.red, FPP.Keywords.yellow, FPP.Keywords.orange], true);
      this.visitExpression;
      this.visitToken(FPP.Operators.COMMA, false);
    }
  }

  // Init Specifier Sequence
  // For component instance definitions
  private visitInitSpecSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      console.log("(" + this.index + ")\t", "Inside init-specifier-seq\tCurrent Token:\t", this.tokens[this.index].text);
      if (this.lookAhead([FPP.Keywords.phase])) {
        this.visitInitSpec();
      } else {
        this.nextIndex();
      }
    }
  }

  // Module Member Sequence
  // For module definitions
  private visitModuleMemberSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      this.nextIndex();
      console.log("(" + this.index + ")\t", "Inside module-member-seq\tCurrent Token:\t", this.tokens[this.index].text);
      switch (this.tokens[this.index].text) {
        // A component definition
        case FPP.Keywords.active:
        case FPP.Keywords.passive:
        case FPP.Keywords.queued:
          this.visitComponentDef();
          break;
        // A component instance definition
        case FPP.Keywords.instance:
          this.visitComponentInstanceDef();
          break;
        // A constant definition
        case FPP.Keywords.constant:
          this.visitConstantDef();
          break;
        // A module definition
        case FPP.Keywords.module:
          this.visitModuleDef();
          break;
        // A port definition
        case FPP.Keywords.port:
          this.visitPortDef();
          break;
        // A struct definition
        case FPP.Keywords.struct:
          this.visitStructDef();
          break;
        // A topology definition
        case FPP.Keywords.topology:
          this.visitTopologyDef();
          break;
        // A location specifier
        case FPP.Keywords.locate:
          this.visitLocationSpec();
          break;
        // An abstract type definition
        case FPP.Keywords.type:
          this.visitTypeDef();
          break;
        // An array definition
        case FPP.Keywords.array:
          this.visitArrayDef();
          break;
        // An enum definition
        case FPP.Keywords.enum:
          this.visitEnumDef();
          break;
        // An include specifier
        case FPP.Keywords.include:
          this.visitIncludeSpec();
          break;
        default:
        //Error
      }
    }
  }

  // Struct Type Member Sequence
  // For struct definitions
  private visitStructTypeMemberSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      this.nextIndex();
      console.log("(" + this.index + ")\t", "Inside struct-type-member-sequence\tCurrent Token:\t", this.tokens[this.index].text);
      this.visitStructTypeMemberDef();
      this.visitToken(FPP.Operators.COMMA, false);
    }
    this.currentScope.pop();
  }

  // Topology Member Sequence
  // For topology definitions
  private visitTopologyMemberSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      this.nextIndex();
      console.log("(" + this.index + ")\t", "Inside topology-member-sequence\tCurrent Token:\t", this.tokens[this.index]?.text);
      switch (this.tokens[this.index].text) {
        // A component instance specifier
        case FPP.Keywords.private:
        case FPP.Keywords.instance:
          this.visitComponentInstanceSpec();
          break;
        // A connection graph specifier
        case FPP.Keywords.connections:
        case FPP.Keywords.command:
        case FPP.Keywords.event:
        case FPP.Keywords.health:
        case FPP.Keywords.param:
        case FPP.Keywords.telemetry:
        case FPP.Keywords.time:
          this.visitConnectionGraphSpec();
          break;
        // A topology import specifier
        case FPP.Keywords.import:
          this.visitTopologyImportSpec();
          break;
        // An include specifier
        case FPP.Keywords.include:
          this.visitIncludeSpec();
          break;
        default:
        //Error
      }
    }
    this.currentScope.pop();
  }

  // Connection Sequence
  // For direct graph specifiers
  // Syntax:
  // port-instance-id [ [ expression ] ] -> port-instance-id [ [ expression ] ]
  private visitConnectionSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      console.log("(" + this.index + ")\t", "Inside Connection Sequence\tCurrent Token:\t", this.tokens[this.index].text);
      this.visitQualifiedIdentifier();
      if (this.lookAhead([FPP.Operators.LBRACKET])) {
        this.visitExpression();
        this.visitToken(FPP.Operators.RBRACKET, true);
      }
      this.visitToken(FPP.Operators.RARROW, true);
      this.visitQualifiedIdentifier();
      if (this.lookAhead([FPP.Operators.LBRACKET])) {
        this.visitExpression();
        this.visitToken(FPP.Operators.RBRACKET, true);
      }
      this.visitToken(FPP.Operators.COMMA, false);
    }
  }

  // Instance Sequence
  // For pattern graph specifiers
  // Syntax:
  // qual-ident
  private visitInstanceSequence() {
    while (this.index < this.tokens.length && !this.lookAhead([FPP.Operators.RBRACE])) {
      console.log("(" + this.index + ")\t", "Inside Instance Sequence\tCurrent Token:\t", this.tokens[this.index].text);
      this.visitQualifiedIdentifier();
      this.visitToken(FPP.Operators.COMMA, false);
    }
  }
}
