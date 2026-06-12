import { GlowInput } from "@p4ni/ui";
import { Section } from "../ui";
import type { Knobs } from "./knobs";

export function GlowInputDemos({ speed, intensity }: Knobs) {
  return (
    <>
      <Section label="default">
        <GlowInput
          placeholder="Type here... / ここに入力..."
          speed={speed}
          intensity={intensity}
        />
      </Section>

      <Section label="coral / fast">
        <GlowInput
          placeholder="Search... / 検索..."
          colors={["#d85a30", "#ed93b1", "#fac775"]}
          speed={1.6}
        />
      </Section>

      <Section label="calm / non-reactive">
        <GlowInput
          placeholder="reactive=false"
          colors={["#1d9e75", "#378add"]}
          speed={6}
          intensity={0.25}
          reactive={false}
        />
      </Section>
    </>
  );
}
