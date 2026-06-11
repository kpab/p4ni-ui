import type { ReactNode } from "react";

export const PALETTES: string[][] = [
  ["#7f77dd", "#1d9e75", "#d85a30", "#ed93b1"],
  ["#d85a30", "#ed93b1", "#fac775"],
  ["#1d9e75", "#378add", "#7f77dd"],
];

export function Chips({
  active,
  onPick,
  groupLabel,
  paletteLabel,
}: {
  active: number;
  onPick: (i: number) => void;
  groupLabel: string;
  paletteLabel: string;
}) {
  return (
    <div className="chips" role="radiogroup" aria-label={groupLabel}>
      {PALETTES.map((p, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={i === active}
          aria-label={`${paletteLabel} ${i + 1}`}
          className={i === active ? "chip on" : "chip"}
          style={{ background: `conic-gradient(${[...p, p[0]].join(", ")})` }}
          onClick={() => onPick(i)}
        />
      ))}
    </div>
  );
}

export function Knob({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="knob">
      <span className="knob-label">
        {label}
        <span className="knob-value">{value}</span>
      </span>
      {children}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
