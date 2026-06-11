import { useRef, useState } from "react";
import { LockInput, type LockInputHandle } from "@p4ni/ui/three";
import { useSiteLocale } from "./siteLocale";

export const KEYWORD = "p4ni";

type Status = "locked" | "failed" | "unlocking" | "unlocked";

export default function LockDemo() {
  const locale = useSiteLocale();
  const lock = useRef<LockInputHandle>(null);
  const [status, setStatus] = useState<Status>("locked");
  const [lastTry, setLastTry] = useState("");

  const copy =
    locale === "ja"
      ? {
          placeholder: "keyword は?",
          hint: `ヒント: keyword は "${KEYWORD}" — 入力して Enter`,
          failed: (v: string) => `"${v}" ではありません — もう一度`,
          unlocking: "解錠中…",
          unlocked: "解錠されました。",
          secretTitle: "UNLOCKED",
          secretBody: "ここに children が展開されます。",
          relock: "もう一度ロック",
        }
      : {
          placeholder: "keyword?",
          hint: `hint: the keyword is "${KEYWORD}" — type it and press Enter`,
          failed: (v: string) => `"${v}" is not it — try again`,
          unlocking: "unlocking…",
          unlocked: "Unlocked.",
          secretTitle: "UNLOCKED",
          secretBody: "Your children render here.",
          relock: "lock again",
        };

  const statusLine: Record<Status, { text: string; color?: string }> = {
    locked: { text: copy.hint },
    failed: { text: copy.failed(lastTry), color: "var(--coral)" },
    unlocking: { text: copy.unlocking, color: "var(--teal)" },
    unlocked: { text: copy.unlocked, color: "var(--teal)" },
  };

  return (
    <div>
      <div className="stage tall">
        <div style={{ width: "min(280px, 100%)", margin: "0 auto" }}>
          <LockInput
            ref={lock}
            keyword={KEYWORD}
            placeholder={copy.placeholder}
            onUnlock={() => setStatus("unlocking")}
            onRevealed={() => setStatus("unlocked")}
            onFail={(v) => {
              setLastTry(v);
              setStatus("failed");
            }}
          >
            <div style={{ textAlign: "center", display: "grid", gap: 10 }}>
              <strong
                style={{
                  fontWeight: 400,
                  fontSize: 18,
                  letterSpacing: "0.5em",
                  textIndent: "0.5em",
                  color: "var(--teal)",
                }}
              >
                {copy.secretTitle}
              </strong>
              <span style={{ fontSize: 11.5, color: "var(--dim)" }}>
                {copy.secretBody}
              </span>
              <button
                type="button"
                className="copy"
                style={{ justifySelf: "center" }}
                onClick={() => {
                  lock.current?.reset();
                  setStatus("locked");
                }}
              >
                {copy.relock}
              </button>
            </div>
          </LockInput>
        </div>
      </div>
      <div className="controls">
        <span aria-live="polite" style={{ color: statusLine[status].color }}>
          {statusLine[status].text}
        </span>
      </div>
    </div>
  );
}
