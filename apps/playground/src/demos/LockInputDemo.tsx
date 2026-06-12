import { useRef } from "react";
import { LockInput, type LockInputHandle } from "@p4ni/ui/three";
import { Section, SectionHeading } from "../ui";

export function LockInputDemo() {
  const lock = useRef<LockInputHandle>(null);

  return (
    <>
      <SectionHeading>LockInput (Three.js)</SectionHeading>

      <Section label='keyword = "p4ni" (theatrical, not cryptographic)'>
        <LockInput
          ref={lock}
          keyword="p4ni"
          placeholder="keyword"
          onUnlock={() => console.log("unlocked!")}
          onFail={(v) => console.log("wrong:", v)}
        >
          <h3 style={{ letterSpacing: "0.5em", color: "#1d9e75", margin: 0 }}>
            UNLOCKED
          </h3>
          <p style={{ fontSize: 13, color: "#8a8a93" }}>
            ここに children が展開されます。
          </p>
          <button onClick={() => lock.current?.reset()}>もう一度ロック</button>
        </LockInput>
      </Section>
    </>
  );
}
