import { useMemo, useState } from "react";
import { SimpleLangEditor } from "@/components/SimpleLangEditor";
import { analyzeSimpleLang } from "@/lib/simplelang/analyze";
import { SIMPLELANG_EBNF } from "@/lib/simplelang/grammar";
import { TEST_CASES } from "@/lib/simplelang/testCases";
import type { AnalyzeResult, SimpleLangError, Token } from "@/lib/simplelang/types";

type TabKey = "tokens" | "grammar";

function formatError(e: SimpleLangError) {
  const loc = e.column ? `Line ${e.line}:${e.column}` : `Line ${e.line}`;
  return `${loc}: ${e.message}`;
}

function TokenRow({ t }: { t: Token }) {
  return (
    <div className="tokenRow">
      <span className="pill">{t.type}</span>
      <span className="tokenValue" title={t.value}>
        {t.value}
      </span>
      <span className="tokenLoc">
        {t.line}:{t.column}
      </span>
    </div>
  );
}

export default function App() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(TEST_CASES[0]?.id ?? "valid");
  const [source, setSource] = useState<string>(TEST_CASES[0]?.source ?? "");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [tab, setTab] = useState<TabKey>("tokens");

  const selectedCase = useMemo(() => TEST_CASES.find((t) => t.id === selectedCaseId), [selectedCaseId]);

  const runAnalyze = () => {
    const r = analyzeSimpleLang(source);
    setResult(r);
  };

  const onPickCase = (id: string) => {
    setSelectedCaseId(id);
    const tc = TEST_CASES.find((t) => t.id === id);
    if (tc) {
      setSource(tc.source);
      setResult(null);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>SimpleLang Syntax Analyzer</h1>
          <p className="subtitle">Paste code, click Analyze, and you’ll get syntax errors with locations and fix suggestions.</p>
        </div>
      </header>

      <main className="content">
        <section className="grid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Editor</h2>
                <p className="muted">Choose a test case or paste your own program.</p>
              </div>
              <label className="field">
                <span className="labelText">Test cases</span>
                <select value={selectedCaseId} onChange={(e) => onPickCase(e.target.value)}>
                  {TEST_CASES.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="panelBody">
              <SimpleLangEditor value={source} onChange={setSource} minHeight={360} />

              <div className="actions">
                <div className="muted">{selectedCase?.description ?? ""}</div>
                <div className="buttonRow">
                  <button className="btn" onClick={() => setResult(null)} disabled={!result}>
                    Clear
                  </button>
                  <button className="btn btnPrimary" onClick={runAnalyze}>
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Results</h2>
                <p className="muted">Errors, fixes, tokens, and the grammar reference.</p>
              </div>
            </div>

            <div className="panelBody">
              <StatusBanner result={result} />

              {result && !result.ok && result.fixes.length > 0 && (
                <div className="box">
                  <div className="boxHeader">
                    <h3>How to fix</h3>
                    <span className="pill">Suggestions</span>
                  </div>
                  <ul className="list">
                    {result.fixes.map((f) => (
                      <li key={f.id}>
                        <strong>{f.title}:</strong> {f.advice}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result && result.errors.length > 0 && (
                <div className="box">
                  <div className="boxHeader">
                    <h3>Error list</h3>
                    <span className={result.ok ? "pill" : "pill pillDanger"}>{result.errors.length}</span>
                  </div>
                  <div className="scroll" style={{ maxHeight: 220 }}>
                    {result.errors.map((e, idx) => (
                      <div key={`${e.code}-${idx}`} className="errorItem">
                        <div className="errorTitle">{formatError(e)}</div>
                        {e.hint && <div className="muted">{e.hint}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="tabs">
                <div className="tabList" role="tablist" aria-label="Results tabs">
                  <button
                    className={tab === "tokens" ? "tab tabActive" : "tab"}
                    type="button"
                    onClick={() => setTab("tokens")}
                    role="tab"
                    aria-selected={tab === "tokens"}
                  >
                    Tokens
                  </button>
                  <button
                    className={tab === "grammar" ? "tab tabActive" : "tab"}
                    type="button"
                    onClick={() => setTab("grammar")}
                    role="tab"
                    aria-selected={tab === "grammar"}
                  >
                    Grammar
                  </button>
                </div>

                {tab === "tokens" ? (
                  <div className="box">
                    <div className="boxHeader">
                      <h3>Token stream</h3>
                      <span className="pill">{result ? result.tokens.length : 0}</span>
                    </div>
                    <div className="scroll" style={{ maxHeight: 280 }}>
                      {result?.tokens.map((t, idx) => (
                        <TokenRow key={`${t.type}-${t.line}-${t.column}-${idx}`} t={t} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="box">
                    <div className="boxHeader">
                      <h3>SimpleLang (EBNF)</h3>
                    </div>
                    <div className="scroll" style={{ maxHeight: 280 }}>
                      <pre className="pre">{SIMPLELANG_EBNF}</pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="footerTip">Tip: Use your editor’s search to quickly jump between errors and tokens.</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusBanner({ result }: { result: AnalyzeResult | null }) {
  if (!result) {
    return (
      <div className="banner">
        <strong>Ready</strong>
        <div className="muted">Click Analyze to validate the program.</div>
      </div>
    );
  }

  if (result.ok) {
    return (
      <div className="banner">
        <strong>Valid syntax</strong>
        <div className="muted">No syntax errors were found.</div>
      </div>
    );
  }

  return (
    <div className="banner bannerDanger">
      <strong>Syntax errors</strong>
      <div className="muted">{result.errors.length} issue(s) found.</div>
    </div>
  );
}

