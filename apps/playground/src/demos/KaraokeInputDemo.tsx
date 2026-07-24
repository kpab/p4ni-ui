import { KaraokeInput } from "@p4ni/ui";
import { Section } from "../ui";

export function KaraokeInputDemo() {
  return (
    <>
      <Section label="karaoke / Enterで採点エフェクト">
        <KaraokeInput
          placeholder={"歌詞っぽく入力して改行してみて…\n（音程が合った時のキラキラが出ます）"}
        />
      </Section>

      <Section label="karaoke / rainbow">
        <KaraokeInput
          rows={3}
          placeholder="虹色バージョン"
          barColors={["#7f77dd", "#ed93b1"]}
          colors={["#7f77dd", "#378add", "#1d9e75", "#ed93b1", "#ffffff"]}
          starCount={26}
        />
      </Section>
    </>
  );
}
