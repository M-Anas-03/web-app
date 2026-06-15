export type TokenType =
  | "KW"
  | "IDENT"
  | "INT"
  | "BOOL"
  | "STRING"
  | "OP"
  | "SYMBOL"
  | "EOF"
  | "UNKNOWN";

export type Token = {
  type: TokenType;
  value: string;
  line: number;
  column: number;
};

export type SimpleLangErrorCode =
  | "UNEXPECTED_TOKEN"
  | "MISSING_SEMICOLON"
  | "MISSING_RBRACE"
  | "INVALID_ASSIGNMENT"
  | "MALFORMED_CONTROL"
  | "LEXER_UNKNOWN"
  | "UNTERMINATED_STRING";

export type SimpleLangError = {
  code: SimpleLangErrorCode;
  message: string;
  line: number;
  column?: number;
  found?: string;
  expected?: string[];
  hint?: string;
};

export type FixSuggestion = {
  id: string;
  title: string;
  advice: string;
};

export type AnalyzeResult = {
  ok: boolean;
  errors: SimpleLangError[];
  tokens: Token[];
  fixes: FixSuggestion[];
};
