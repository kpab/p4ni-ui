import type { ReactNode } from "react";

// ハーネス共通の見た目部品。デモ本体は demos/ 配下に置く。

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 500, margin: "16px 0 0" }}>
      {children}
    </h2>
  );
}

export function Section({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <p style={{ fontSize: 13, color: "#8a8a93", margin: 0 }}>{label}</p>
      {children}
    </section>
  );
}

export function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1 }}
      />
    </label>
  );
}
