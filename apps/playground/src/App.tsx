import { useState } from "react";
import { GlowInput } from "@p4ni/ui";
import { AuraInput } from "@p4ni/ui/aura";

export function App() {
  const [speed, setSpeed] = useState(3.2);
  const [intensity, setIntensity] = useState(0.45);

  return (
    <main style={{ width: "min(420px, 90vw)", display: "grid", gap: 32 }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>
        @p4ni/ui playground
      </h1>

      <section style={{ display: "grid", gap: 8 }}>
        <p style={{ fontSize: 13, color: "#8a8a93", margin: 0 }}>default</p>
        <GlowInput placeholder="ここに入力してみて…" speed={speed} intensity={intensity} />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <p style={{ fontSize: 13, color: "#8a8a93", margin: 0 }}>coral / fast</p>
        <GlowInput
          placeholder="検索..."
          colors={["#d85a30", "#ed93b1", "#faC775"]}
          speed={1.6}
        />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <p style={{ fontSize: 13, color: "#8a8a93", margin: 0 }}>calm / non-reactive</p>
        <GlowInput
          placeholder="reactive=false"
          colors={["#1d9e75", "#378add"]}
          speed={6}
          intensity={0.25}
          reactive={false}
        />
      </section>

      <h2 style={{ fontSize: 15, fontWeight: 500, margin: "16px 0 0" }}>
        AuraInput (WebGL)
      </h2>

      <section style={{ display: "grid", gap: 8 }}>
        <p style={{ fontSize: 13, color: "#8a8a93", margin: 0 }}>default</p>
        <AuraInput
          placeholder="タイピングで脈動..."
          speed={speed}
          intensity={intensity}
        />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <p style={{ fontSize: 13, color: "#8a8a93", margin: 0 }}>
          particles=false
        </p>
        <AuraInput
          placeholder="パルス無し"
          colors={["#1d9e75", "#378add", "#7f77dd"]}
          particles={false}
          speed={speed}
          intensity={intensity}
        />
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <p style={{ fontSize: 13, color: "#8a8a93", margin: 0 }}>bleed=48</p>
        <AuraInput
          placeholder="広めのオーラ"
          colors={["#d85a30", "#ed93b1", "#fac775"]}
          bleed={48}
          speed={speed}
          intensity={intensity}
        />
      </section>

      <section style={{ display: "grid", gap: 12, fontSize: 13, color: "#8a8a93" }}>
        <label style={{ display: "flex", gap: 12, alignItems: "center" }}>
          speed: {speed.toFixed(1)}s
          <input
            type="range" min={0.5} max={8} step={0.1} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </label>
        <label style={{ display: "flex", gap: 12, alignItems: "center" }}>
          intensity: {intensity.toFixed(2)}
          <input
            type="range" min={0} max={1} step={0.05} value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </label>
      </section>
    </main>
  );
}
