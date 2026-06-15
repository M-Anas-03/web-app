import type { FixSuggestion, SimpleLangError } from "./types";

export function buildFixSuggestions(errors: SimpleLangError[]): FixSuggestion[] {
  const suggestions: FixSuggestion[] = [];
  const add = (id: string, title: string, advice: string) => {
    if (!suggestions.some((s) => s.id === id)) suggestions.push({ id, title, advice });
  };

  for (const e of errors) {
    switch (e.code) {
      case "MISSING_SEMICOLON":
        add(
          "add_semicolons",
          "Add missing semicolons",
          "Declarations and assignments must end with ';' (e.g., int x; or x = 10;).",
        );
        break;
      case "MISSING_RBRACE":
        add(
          "close_braces",
          "Close blocks with '}'",
          "Every '{' must have a matching '}'. Check if/for/while blocks and nested blocks.",
        );
        break;
      case "INVALID_ASSIGNMENT":
        add(
          "fix_assignment",
          "Fix assignment shape",
          "Assignments must look like: IDENT = expression; (left side must be a variable name, right side must be a value/expression).",
        );
        break;
      case "MALFORMED_CONTROL":
        add(
          "fix_control",
          "Fix control structure syntax",
          "Use: if (cond) { ... }  |  while (cond) { ... }  |  for (init; cond; update) { ... }",
        );
        break;
      case "UNTERMINATED_STRING":
        add(
          "close_strings",
          "Close string literals",
          "String values must be wrapped in double quotes, e.g. x = \"Sufiyan\";",
        );
        break;
      case "LEXER_UNKNOWN":
        add(
          "remove_unknown",
          "Remove unknown characters",
          "Only use SimpleLang tokens (keywords, identifiers, numbers, operators, string literals, and symbols).",
        );
        break;
      default:
        add(
          "review_expected",
          "Follow the expected tokens",
          "Use the error's “Expected … found …” message to insert the missing token or remove the unexpected one.",
        );
        break;
    }
  }

  return suggestions;
}
