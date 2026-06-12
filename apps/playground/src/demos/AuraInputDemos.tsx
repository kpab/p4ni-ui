import { AuraInput } from "@p4ni/ui/aura";
import { Section, SectionHeading } from "../ui";
import type { Knobs } from "./knobs";

export function AuraInputDemos({ speed, intensity }: Knobs) {
  return (
    <>
      <SectionHeading>AuraInput (WebGL)</SectionHeading>

      <Section label="default">
        <AuraInput
          placeholder="Type and it breathes... / 入力で脈動..."
          speed={speed}
          intensity={intensity}
        />
      </Section>

      <Section label="particles=false">
        <AuraInput
          placeholder="No pulse / パルスなし"
          colors={["#1d9e75", "#378add", "#7f77dd"]}
          particles={false}
          speed={speed}
          intensity={intensity}
        />
      </Section>

      <Section label="bleed=48">
        <AuraInput
          placeholder="Wider aura / 広めのオーラ"
          colors={["#d85a30", "#ed93b1", "#fac775"]}
          bleed={48}
          speed={speed}
          intensity={intensity}
        />
      </Section>
    </>
  );
}
