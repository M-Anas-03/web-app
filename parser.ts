import type { SimpleLangError, Token } from "./types";

const SYNC_VALUES = new Set([";", "}"]); // simple recovery

function tokLabel(t: Token) {
  return `${t.type}('${t.value}')`;
}

export class Parser {
  private i = 0;
  public errors: SimpleLangError[] = [];

  constructor(private tokens: Token[]) {}

  private cur(): Token {
    return this.tokens[this.i] ?? this.tokens[this.tokens.length - 1];
  }

  private peek(n = 1): Token {
    return this.tokens[this.i + n] ?? this.tokens[this.tokens.length - 1];
  }

  private atEOF() {
    return this.cur().type === "EOF";
  }

  private match(type: Token["type"], value?: string) {
    const t = this.cur();
    if (t.type !== type) return false;
    if (value !== undefined && t.value !== value) return false;
    return true;
  }

  private consume(type: Token["type"], value?: string, expected?: string[]) {
    const t = this.cur();
    if (this.match(type, value)) {
      this.i++;
      return t;
    }

    this.error("UNEXPECTED_TOKEN", {
      token: t,
      message: `Expected ${value ?? type}, found ${tokLabel(t)}`,
      expected,
    });
    return null;
  }

  private error(
    code: SimpleLangError["code"],
    opts: {
      token: Token;
      message: string;
      expected?: string[];
      hint?: string;
    },
  ) {
    this.errors.push({
      code,
      message: opts.message,
      line: opts.token.line,
      column: opts.token.column,
      found: tokLabel(opts.token),
      expected: opts.expected,
      hint: opts.hint,
    });
  }

  private sync() {
    // Skip forward until a safe re-entry point.
    while (!this.atEOF() && !SYNC_VALUES.has(this.cur().value)) this.i++;

    // Consume the synchronizing token so we always make progress
    if (this.cur().value === ";" || this.cur().value === "}") this.i++;
  }

  // program -> { decl_or_stmt } EOF
  parseProgram() {
    while (!this.atEOF()) {
      if (this.isTypeKw()) this.parseDeclarationOrRecover();
      else this.parseStatementOrRecover();
    }
  }

  private parseDeclarationOrRecover() {
    const start = this.i;
    try {
      this.parseDeclaration(true);
    } catch {
      this.i = start;
      this.sync();
    }
  }

  private parseStatementOrRecover() {
    const start = this.i;
    try {
      this.parseStatement();
    } catch {
      this.i = start;
      this.sync();
    }
  }

  // declaration -> type IDENT ';'
  private parseDeclaration(requireSemi: boolean) {
    this.parseType();
    const ident = this.consume("IDENT", undefined, ["IDENT"]) ?? this.cur();
    if (ident.type !== "IDENT") {
      this.error("UNEXPECTED_TOKEN", {
        token: this.cur(),
        message: "Expected identifier after type in declaration",
        expected: ["IDENT"],
        hint: "Declarations look like: int x;",
      });
      throw new Error("decl");
    }

    if (requireSemi) {
      if (!this.match("SYMBOL", ";")) {
        this.error("MISSING_SEMICOLON", {
          token: this.cur(),
          message: "Expected ';' after declaration",
          expected: [";"],
          hint: "Add a semicolon at the end of the declaration.",
        });
        throw new Error("semi");
      }
      this.consume("SYMBOL", ";");
    }
  }

  // type -> 'int' | 'bool' | 'string'
  private parseType() {
    const t = this.cur();
    if (t.type === "KW" && (t.value === "int" || t.value === "bool" || t.value === "string")) {
      this.i++;
      return;
    }
    this.error("UNEXPECTED_TOKEN", {
      token: t,
      message: `Expected type keyword (int|bool|string), found ${tokLabel(t)}`,
      expected: ["int", "bool", "string"],
      hint: "Use a supported type: int, bool, or string.",
    });
    throw new Error("type");
  }

  private isTypeKw() {
    const t = this.cur();
    return t.type === "KW" && (t.value === "int" || t.value === "bool" || t.value === "string");
  }

  // statement -> assignment ';' | if_stmt | for_stmt | while_stmt | block
  private parseStatement() {
    const t = this.cur();

    if (t.type === "SYMBOL" && t.value === "{") return this.parseBlock();
    if (t.type === "KW" && t.value === "if") return this.parseIf();
    if (t.type === "KW" && t.value === "for") return this.parseFor();
    if (t.type === "KW" && t.value === "while") return this.parseWhile();
    if (t.type === "KW" && t.value === "print") return this.parsePrint();

    // assignment ';'
    const okAssign = this.parseAssignment();
    if (!okAssign) throw new Error("assign");

    if (!this.match("SYMBOL", ";")) {
      this.error("MISSING_SEMICOLON", {
        token: this.cur(),
        message: "Expected ';' after assignment",
        expected: [";"],
        hint: "Statements end with a semicolon, e.g. x = 10;",
      });
      throw new Error("semi");
    }
    this.consume("SYMBOL", ";");
  }

  // print_stmt -> 'print' '(' expression ')' ';'
  private parsePrint() {
    this.consume("KW", "print");

    if (!this.match("SYMBOL", "(")) {
      this.error("UNEXPECTED_TOKEN", {
        token: this.cur(),
        message: "Expected '(' after 'print'",
        expected: ["("],
        hint: "Use: print(expression);",
      });
      throw new Error("print");
    }
    this.consume("SYMBOL", "(");

    const okExpr = this.parseExpression();
    if (!okExpr) {
      this.error("UNEXPECTED_TOKEN", {
        token: this.cur(),
        message: "Expected expression inside print(...)",
        hint: "Example: print(x); or print(1 + 2);",
      });
      throw new Error("print");
    }

    if (!this.match("SYMBOL", ")")) {
      this.error("UNEXPECTED_TOKEN", {
        token: this.cur(),
        message: "Expected ')' to close print(...)",
        expected: [")"],
        hint: "Close the parentheses: print(expr);",
      });
      throw new Error("print");
    }
    this.consume("SYMBOL", ")");

    if (!this.match("SYMBOL", ";")) {
      this.error("MISSING_SEMICOLON", {
        token: this.cur(),
        message: "Expected ';' after print statement",
        expected: [";"],
        hint: "Statements end with a semicolon, e.g. print(x);",
      });
      throw new Error("print");
    }
    this.consume("SYMBOL", ";");
  }

  // block -> '{' { decl_or_stmt } '}'
  private parseBlock() {
    this.consume("SYMBOL", "{");
    while (!this.atEOF() && !(this.cur().type === "SYMBOL" && this.cur().value === "}")) {
      if (this.isTypeKw()) this.parseDeclarationOrRecover();
      else this.parseStatementOrRecover();
    }
    if (!this.match("SYMBOL", "}")) {
      this.error("MISSING_RBRACE", {
        token: this.cur(),
        message: "Expected '}' to close block",
        expected: ["}"],
        hint: "Add a closing '}' for the block.",
      });
      throw new Error("rbrace");
    }
    this.consume("SYMBOL", "}");
  }

  // assignment -> IDENT '=' expression
  // returns false when the target is invalid
  private parseAssignment(): boolean {
    const t = this.cur();
    if (t.type !== "IDENT") {
      this.error("INVALID_ASSIGNMENT", {
        token: t,
        message: "Invalid assignment target (must be an identifier)",
        expected: ["IDENT"],
        hint: "Assignments look like: x = expr;",
      });
      return false;
    }
    this.i++;

    if (!this.match("OP", "=")) {
      this.error("INVALID_ASSIGNMENT", {
        token: this.cur(),
        message: "Expected '=' in assignment",
        expected: ["="],
        hint: "Use '=' to assign a value, e.g. x = 10;",
      });
      return false;
    }
    this.consume("OP", "=");

    // expression
    const okExpr = this.parseExpression();
    if (!okExpr) {
      this.error("INVALID_ASSIGNMENT", {
        token: this.cur(),
        message: "Expected expression on the right-hand side of assignment",
        hint: "Provide a value/expression, e.g. x = x + 1;",
      });
      return false;
    }
    return true;
  }

  // if_stmt -> 'if' '(' expression ')' block
  private parseIf() {
    const kw = this.consume("KW", "if");
    if (!this.match("SYMBOL", "(")) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected '(' after 'if'",
        expected: ["("],
        hint: "Use: if (condition) { ... }",
      });
      throw new Error("if");
    }
    this.consume("SYMBOL", "(");
    this.parseExpression();
    if (!this.match("SYMBOL", ")")) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected ')' after if condition",
        expected: [")"],
        hint: "Close the condition parentheses: if (cond) { ... }",
      });
      throw new Error("if");
    }
    this.consume("SYMBOL", ")");
    this.parseBlock();
    return kw;
  }

  // while_stmt -> 'while' '(' expression ')' block
  private parseWhile() {
    this.consume("KW", "while");
    if (!this.match("SYMBOL", "(")) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected '(' after 'while'",
        expected: ["("],
        hint: "Use: while (condition) { ... }",
      });
      throw new Error("while");
    }
    this.consume("SYMBOL", "(");
    this.parseExpression();
    if (!this.match("SYMBOL", ")")) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected ')' after while condition",
        expected: [")"],
        hint: "Close the condition parentheses: while (cond) { ... }",
      });
      throw new Error("while");
    }
    this.consume("SYMBOL", ")");
    this.parseBlock();
  }

  // for_stmt -> 'for' '(' for_init ';' expression ';' assignment ')' block
  private parseFor() {
    this.consume("KW", "for");
    if (!this.match("SYMBOL", "(")) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected '(' after 'for'",
        expected: ["("],
        hint: "Use: for (init; condition; update) { ... }",
      });
      throw new Error("for");
    }
    this.consume("SYMBOL", "(");

    // for_init -> declaration_no_semicolon | assignment | ε
    if (this.isTypeKw()) {
      this.parseDeclarationNoSemicolon();
    } else if (this.cur().type === "IDENT") {
      this.parseAssignment();
    }

    if (!this.match("SYMBOL", ";")) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected ';' after for-init",
        expected: [";"],
        hint: "The for header must have 2 semicolons: for (init; cond; update)",
      });
      throw new Error("for");
    }
    this.consume("SYMBOL", ";");

    this.parseExpression();

    if (!this.match("SYMBOL", ";")) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected ';' after for condition",
        expected: [";"],
        hint: "The for header must have 2 semicolons: for (init; cond; update)",
      });
      throw new Error("for");
    }
    this.consume("SYMBOL", ";");

    // update assignment
    if (!this.parseAssignment()) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected assignment in for-update (e.g., i = i + 1)",
        hint: "Use an assignment as the update part: for (...; ...; i = i + 1)",
      });
      throw new Error("for");
    }

    if (!this.match("SYMBOL", ")")) {
      this.error("MALFORMED_CONTROL", {
        token: this.cur(),
        message: "Expected ')' to close for header",
        expected: [")"],
        hint: "Close the for header parentheses: for (...) { ... }",
      });
      throw new Error("for");
    }
    this.consume("SYMBOL", ")");

    this.parseBlock();
  }

  // declaration_no_semicolon -> type IDENT ( '=' expression )?
  private parseDeclarationNoSemicolon() {
    this.parseType();
    const ident = this.consume("IDENT", undefined, ["IDENT"]) ?? this.cur();
    if (ident.type !== "IDENT") {
      this.error("UNEXPECTED_TOKEN", {
        token: this.cur(),
        message: "Expected identifier in for-init declaration",
        expected: ["IDENT"],
        hint: "For-init declarations look like: for (int i = 0; ... )",
      });
      throw new Error("forinit");
    }

    if (this.match("OP", "=")) {
      this.consume("OP", "=");
      this.parseExpression();
    }
  }

  // Expression precedence
  private parseExpression(): boolean {
    return this.parseOr();
  }

  private parseOr(): boolean {
    if (!this.parseAnd()) return false;
    while (this.match("OP", "||")) {
      this.i++;
      if (!this.parseAnd()) return false;
    }
    return true;
  }

  private parseAnd(): boolean {
    if (!this.parseRel()) return false;
    while (this.match("OP", "&&")) {
      this.i++;
      if (!this.parseRel()) return false;
    }
    return true;
  }

  private parseRel(): boolean {
    if (!this.parseAdd()) return false;
    while (
      this.cur().type === "OP" &&
      ["<", ">", "<=", ">=", "==", "!="].includes(this.cur().value)
    ) {
      this.i++;
      if (!this.parseAdd()) return false;
    }
    return true;
  }

  private parseAdd(): boolean {
    if (!this.parseMul()) return false;
    while (this.cur().type === "OP" && (this.cur().value === "+" || this.cur().value === "-")) {
      this.i++;
      if (!this.parseMul()) return false;
    }
    return true;
  }

  private parseMul(): boolean {
    if (!this.parseUnary()) return false;
    while (this.cur().type === "OP" && (this.cur().value === "*" || this.cur().value === "/")) {
      this.i++;
      if (!this.parseUnary()) return false;
    }
    return true;
  }

  private parseUnary(): boolean {
    if (this.match("OP", "-")) {
      this.i++;
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): boolean {
    const t = this.cur();
    if (t.type === "INT" || t.type === "BOOL" || t.type === "STRING" || t.type === "IDENT") {
      this.i++;
      return true;
    }
    if (t.type === "SYMBOL" && t.value === "(") {
      this.i++;
      const ok = this.parseExpression();
      if (!this.match("SYMBOL", ")")) {
        this.error("UNEXPECTED_TOKEN", {
          token: this.cur(),
          message: "Expected ')' to close expression",
          expected: [")"],
          hint: "Close the parentheses in the expression.",
        });
        return false;
      }
      this.i++;
      return ok;
    }

    // not a valid primary
    return false;
  }
}
