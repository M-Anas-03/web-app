import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

import { simpleLangLanguage } from "@/lib/simplelang/codemirror";

type Props = {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
};

export function SimpleLangEditor({ value, onChange, minHeight = 360 }: Props) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const extensions = useMemo(
    () => [
      simpleLangLanguage,
      EditorView.lineWrapping,
      EditorView.theme(
        {
          "&": { backgroundColor: "transparent" },
          ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
        },
        { dark: true },
      ),
    ],
    [],
  );

  return (
    <div className="editorShell">
      <CodeMirror
        value={local}
        height={`${minHeight}px`}
        theme={oneDark}
        extensions={extensions}
        onChange={(v) => {
          setLocal(v);
          onChange(v);
        }}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
        }}
      />
    </div>
  );
}

