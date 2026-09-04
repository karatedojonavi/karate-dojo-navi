import type { Metadata } from "next";
import { PreparingPage } from "@/components/preparing-page";

export const metadata: Metadata = {
  title: "利用規約",
  description: "空手道場ナビの利用規約(準備中)",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="利用規約"
      note="本サービスの利用条件を定めた利用規約を掲載予定です。公開までの間にご不明な点がありましたら、お問い合わせページからご連絡ください。"
    />
  );
}
