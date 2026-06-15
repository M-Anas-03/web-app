import { StreamLanguage } from "@codemirror/language";
import { simpleMode } from "@codemirror/legacy-modes/mode/simple-mode";

export const simpleLangLanguage = StreamLanguage.define(
  simpleMode({
    start: [
      { regex: /\/\/.*$/, token: "comment" },
      { regex: /\"(?:\\\\|\\\"|[^\"\\])*\"/, token: "string" },
      { regex: /\b(?:true|false)\b/, token: "bool" },
      { regex: /\b(?:int|bool|string|if|for|while|print)\b/, token: "keyword" },
      { regex: /\b\d+\b/, token: "number" },
      { regex: /[+\-*/=<>!]+/, token: "operator" },
      { regex: /[{}();,]/, token: "punctuation" },
      { regex: /[A-Za-z_][A-Za-z0-9_]*/, token: "variableName" },
    ],
  }),
);
