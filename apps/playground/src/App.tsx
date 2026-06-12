import { useState } from "react";
import { GlowInputDemos } from "./demos/GlowInputDemos";
import { AuraInputDemos } from "./demos/AuraInputDemos";
import { LockInputDemo } from "./demos/LockInputDemo";
import { Slider } from "./ui";

export function App() {
  const [speed, setSpeed] = useState(3.2);
  const [intensity, setIntensity] = useState(0.45);

  return (
    <main style={{ width: "min(420px, 90vw)", display: "grid", gap: 32 }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>
        @p4ni/ui playground
      </h1>

      <GlowInputDemos speed={speed} intensity={intensity} />
      <AuraInputDemos speed={speed} intensity={intensity} />
      <LockInputDemo />

      <section
        style={{ display: "grid", gap: 12, fontSize: 13, color: "#8a8a93" }}
      >
        <Slider
          label={`speed: ${speed.toFixed(1)}s`}
          min={0.5}
          max={8}
          step={0.1}
          value={speed}
          onChange={setSpeed}
        />
        <Slider
          label={`intensity: ${intensity.toFixed(2)}`}
          min={0}
          max={1}
          step={0.05}
          value={intensity}
          onChange={setIntensity}
        />
      </section>
    </main>
  );
}
