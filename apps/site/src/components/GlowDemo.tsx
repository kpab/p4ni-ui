import { useState } from "react";
import { GlowInput } from "@p4ni/ui";
import { Chips, Knob, PALETTES, Toggle } from "./controls";
import { useSiteLocale } from "./siteLocale";

export default function GlowDemo() {
  const locale = useSiteLocale();
  const [palette, setPalette] = useState(0);
  const [speed, setSpeed] = useState(3.2);
  const [intensity, setIntensity] = useState(0.45);
  const [reactive, setReactive] = useState(true);
  const copy =
    locale === "ja"
      ? {
          placeholder: "ここに入力...",
          chips: "カラーパレット",
          palette: "パレット",
          reactive: "反応あり",
        }
      : {
          placeholder: "Type here...",
          chips: "color palette",
          palette: "palette",
          reactive: "reactive",
        };

  return (
    <div>
      <div className="stage">
        <GlowInput
          placeholder={copy.placeholder}
          colors={PALETTES[palette]}
          speed={speed}
          intensity={intensity}
          reactive={reactive}
        />
      </div>
      <div className="controls">
        <Chips
          active={palette}
          onPick={setPalette}
          groupLabel={copy.chips}
          paletteLabel={copy.palette}
        />
        <Knob label="speed" value={`${speed.toFixed(1)}s`}>
          <input
            type="range"
            min={0.5}
            max={8}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </Knob>
        <Knob label="intensity" value={intensity.toFixed(2)}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
          />
        </Knob>
        <Toggle label={copy.reactive} checked={reactive} onChange={setReactive} />
      </div>
    </div>
  );
}
