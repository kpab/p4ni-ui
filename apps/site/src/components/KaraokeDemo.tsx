import { useState } from "react";
import { KaraokeInput } from "@p4ni/ui";
import { Knob } from "./controls";
import { useSiteLocale } from "./siteLocale";

const PRESETS: {
  name: string;
  barColors: [string, string];
  colors: string[];
}[] = [
  {
    name: "gold",
    barColors: ["#ffdf6e", "#ff9d2e"],
    colors: ["#ffe066", "#fff6c2", "#ffc93c", "#ffffff"],
  },
  {
    name: "rainbow",
    barColors: ["#7f77dd", "#ed93b1"],
    colors: ["#7f77dd", "#378add", "#1d9e75", "#ed93b1", "#ffffff"],
  },
];

export default function KaraokeDemo() {
  const locale = useSiteLocale();
  const [preset, setPreset] = useState(0);
  const [starCount, setStarCount] = useState(18);

  const copy =
    locale === "ja"
      ? {
          placeholder:
            "歌詞っぽく入力して Enter で改行…\n（音程が合った時のあのキラキラ）",
          hint: "Enter で行が確定するとエフェクトが出ます",
          stars: "stars",
        }
      : {
          placeholder:
            "Type a lyric, press Enter…\n(that pitch-match sparkle)",
          hint: "Committing a line with Enter fires the effect",
          stars: "stars",
        };

  return (
    <div>
      <div className="stage">
        <KaraokeInput
          placeholder={copy.placeholder}
          barColors={PRESETS[preset].barColors}
          colors={PRESETS[preset].colors}
          starCount={starCount}
        />
      </div>
      <div className="controls">
        {PRESETS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            className="copy"
            aria-pressed={i === preset}
            style={
              i === preset
                ? { borderColor: PRESETS[i].barColors[0], color: PRESETS[i].barColors[0] }
                : undefined
            }
            onClick={() => setPreset(i)}
          >
            {p.name}
          </button>
        ))}
        <Knob label={copy.stars} value={String(starCount)}>
          <input
            type="range"
            min={6}
            max={40}
            step={1}
            value={starCount}
            onChange={(e) => setStarCount(Number(e.target.value))}
          />
        </Knob>
        <span aria-live="polite">{copy.hint}</span>
      </div>
    </div>
  );
}
