import type { Token } from "./types";

const KEYWORDS = new Set(["int", "bool", "string", "if", "for", "while", "print", "true", "false"]);

const TWO_CHAR_OPS = new Set(["&&", "||", "<=", ">=", "==", "!="]);
const ONE_CHAR_OPS = new Set(["+", "-", "*", "/", "=", "<", ">"]);
const SYMBOLS = new Set([";", "{", "}", "(", ")", ","]);

function isAlpha(ch: string) {
  return /[A-Za-z_]/.test(ch);
}
function isAlphaNum(ch: string) {
  return /[A-Za-z0-9_]/.test(ch);
}
function isDigit(ch: string) {
  return /[0-9]/.test(ch);
}

export function lex(source: string): {
  tokens: Token[];
  unknownChars: Token[];
  unterminatedStrings: Token[];
} {
  const tokens: Token[] = [];
  const unknownChars: Token[] = [];
  const unterminatedStrings: Token[] = [];

  let i = 0;
  let line = 1;
  let col = 1;

  const push = (t: Token) => tokens.push(t);

  const advance = (n = 1) => {
    for (let k = 0; k < n; k++) {
      const ch = source[i];
      i++;
      if (ch === "\n") {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
  };

  while (i < source.length) {
    const ch = source[i];

    // whitespace
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      advance(1);
      continue;
    }

    // comments: //...
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") advance(1);
      continue;
    }

    const startLine = line;
    const startCol = col;

    // 2-char ops
    const two = source.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(two)) {
      push({ type: "OP", value: two, line: startLine, column: startCol });
      advance(2);
      continue;
    }

    // 1-char ops
    if (ONE_CHAR_OPS.has(ch)) {
      push({ type: "OP", value: ch, line: startLine, column: startCol });
      advance(1);
      continue;
    }

    // string literal: "..." (supports simple escapes: \\ and \" )
    if (ch === "\"") {
      advance(1); // consume opening quote
      let value = "";
      let closed = false;
      while (i < source.length) {
        const c = source[i];
        if (c === "\n") break;
        if (c === "\\") {
          const next = source[i + 1];
          if (next === "\\" || next === "\"") {
            value += next;
            advance(2);
            continue;
          }
          // keep unknown escape as-is
          value += c;
          advance(1);
          continue;
        }
        if (c === "\"") {
          closed = true;
          advance(1); // consume closing quote
          break;
        }
        value += c;
        advance(1);
      }

      if (!closed) {
        unterminatedStrings.push({ type: "UNKNOWN", value: "\"", line: startLine, column: startCol });
        // do not consume newline here (handled by whitespace branch)
      } else {
        push({ type: "STRING", value, line: startLine, column: startCol });
      }
      continue;
    }

    // symbols
    if (SYMBOLS.has(ch)) {
      push({ type: "SYMBOL", value: ch, line: startLine, column: startCol });
      advance(1);
      continue;
    }

    // integer
    if (isDigit(ch)) {
      let j = i;
      while (j < source.length && isDigit(source[j])) j++;
      const value = source.slice(i, j);
      push({ type: "INT", value, line: startLine, column: startCol });
      advance(j - i);
      continue;
    }

    // identifier or keyword
    if (isAlpha(ch)) {
      let j = i;
      while (j < source.length && isAlphaNum(source[j])) j++;
      const value = source.slice(i, j);
      if (value === "true" || value === "false") {
        push({ type: "BOOL", value, line: startLine, column: startCol });
      } else if (KEYWORDS.has(value)) {
        push({ type: "KW", value, line: startLine, column: startCol });
      } else {
        push({ type: "IDENT", value, line: startLine, column: startCol });
      }
      advance(j - i);
      continue;
    }

    // unknown
    const t: Token = { type: "UNKNOWN", value: ch, line: startLine, column: startCol };
    unknownChars.push(t);
    push(t);
    advance(1);
  }

  tokens.push({ type: "EOF", value: "<EOF>", line, column: col });
  return { tokens, unknownChars, unterminatedStrings };
}
