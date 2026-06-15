export type TestCase = {
  id: string;
  label: string;
  description: string;
  source: string;
};

export const TEST_CASES: TestCase[] = [
  {
    id: "valid",
    label: "1) Valid (all constructs)",
    description: "Uses declarations, assignments, expressions, if, for, and while.",
    source: `int x;
bool flag;
string name;

x = 10;
flag = true;
name = "Sufiyan";

if (x > 0) {
  x = x - 1;
}

for (int i = 0; i < 10; i = i + 1) {
  x = x + i;
}

while (x > 0 && flag) {
  x = x - 1;
}
`,
  },
  {
    id: "print_int",
    label: "2) Print (int)",
    description: "Example: print(x);",
    source: `int x;
x = 5;
print(x);
`,
  },
  {
    id: "print_string",
    label: "3) Print (string)",
    description: "Example: print(\"hi\");",
    source: `string name;
name = "hi";
print(name);
`,
  },
  {
    id: "decl_error",
    label: "4) Declaration error",
    description: "Missing identifier or semicolon in a declaration.",
    source: `int;
bool flag
x = 1;
`,
  },
  {
    id: "missing_brace",
    label: "5) Missing brace",
    description: "Unclosed block after control structure.",
    source: `int x;

if (x > 0) {
  x = x - 1;

x = 2;
`,
  },
  {
    id: "invalid_assignment",
    label: "6) Invalid assignment",
    description: "Invalid assignment target or missing RHS expression.",
    source: `int x;
10 = x;
x = ;
`,
  },
  {
    id: "malformed_control",
    label: "7) Malformed control structure",
    description: "Malformed for header (missing semicolons / parentheses).",
    source: `int x;
for (int i = 0 i < 10; i = i + 1) {
  x = x + 1;
}
`,
  },
];
