import { useState } from "react";
import { AuraInput } from "@p4ni/ui/aura";
import { Chips, Knob, PALETTES, Toggle } from "./controls";
import { useSiteLocale } from "./siteLocale";

export default function AuraDemo() {
  const locale = useSiteLocale();
  const [palette, setPalette] = useState(0);
  const [speed, setSpeed] = useState(3.2);
  const [intensity, setIntensity] = useState(0.45);
  const [bleed, setBleed] = useState(24);
  const [particles, setParticles] = useState(true);
  const copy =
    locale === "ja"
      ? {
          placeholder: "入力で脈動...",
          chips: "カラーパレット",
          palette: "パレット",
          particles: "粒子あり",
        }
      : {
          placeholder: "Type and it breathes...",
          chips: "color palette",
          palette: "palette",
          particles: "particles",
        };

  return (
    <div>
      <div className="stage tall">
        <AuraInput
          placeholder={copy.placeholder}
          colors={PALETTES[palette]}
          speed={speed}
          intensity={intensity}
          bleed={bleed}
          particles={particles}
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
        <Knob label="bleed" value={`${bleed}px`}>
          <input
            type="range"
            min={8}
            max={64}
            step={2}
            value={bleed}
            onChange={(e) => setBleed(Number(e.target.value))}
          />
        </Knob>
        <Toggle label={copy.particles} checked={particles} onChange={setParticles} />
      </div>
    </div>
  );
}
