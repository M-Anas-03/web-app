export const SIMPLELANG_EBNF = `program           -> { decl_or_stmt } EOF

decl_or_stmt       -> declaration | statement

declaration        -> type IDENT ';'
type               -> 'int' | 'bool' | 'string'

statement          -> assignment ';'
                   | print_stmt ';'
                   | if_stmt
                   | for_stmt
                   | while_stmt
                   | block

block              -> '{' { decl_or_stmt } '}'

assignment         -> IDENT '=' expression

print_stmt         -> 'print' '(' expression ')'

if_stmt            -> 'if' '(' expression ')' block

for_stmt           -> 'for' '(' for_init ';' expression ';' assignment ')' block
for_init           -> declaration_no_semicolon | assignment | ε

declaration_no_semicolon -> type IDENT ( '=' expression )?

while_stmt         -> 'while' '(' expression ')' block

expression         -> or
or                 -> and { '||' and }
and                -> rel { '&&' rel }
rel                -> add { ('<' | '>' | '<=' | '>=' | '==' | '!=') add }
add                -> mul { ('+' | '-') mul }
mul                -> unary { ('*' | '/') unary }
unary              -> '-' unary | primary
primary            -> INT | BOOL | STRING | IDENT | '(' expression ')'
`;
