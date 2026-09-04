import type { Metadata } from "next";
import { PreparingPage } from "@/components/preparing-page";

export const metadata: Metadata = {
  title: "掲載基準",
  description: "空手道場ナビの掲載基準(準備中)",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="掲載基準"
      note="掲載の対象範囲、掲載をお断りする場合、修正・削除依頼の方法を掲載予定です。"
    />
  );
}
