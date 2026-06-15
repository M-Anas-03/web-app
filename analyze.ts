import { lex } from "./lexer";
import { Parser } from "./parser";
import { buildFixSuggestions } from "./suggestFixes";
import type { AnalyzeResult, SimpleLangError } from "./types";

export function analyzeSimpleLang(source: string): AnalyzeResult {
  const { tokens, unknownChars, unterminatedStrings } = lex(source);

  const errors: SimpleLangError[] = [];
  for (const t of unknownChars) {
    errors.push({
      code: "LEXER_UNKNOWN",
      message: `Unknown character '${t.value}'`,
      line: t.line,
      column: t.column,
      hint: "Remove or replace the character with a valid token.",
    });
  }

  for (const t of unterminatedStrings) {
    errors.push({
      code: "UNTERMINATED_STRING",
      message: "Unterminated string literal",
      line: t.line,
      column: t.column,
      hint: "Close the string with a matching double quote (\").",
    });
  }

  const parser = new Parser(tokens);
  parser.parseProgram();

  const mergedErrors = [...errors, ...parser.errors];
  const ok = mergedErrors.length === 0;

  return {
    ok,
    errors: mergedErrors,
    tokens,
    fixes: buildFixSuggestions(mergedErrors),
  };
}

