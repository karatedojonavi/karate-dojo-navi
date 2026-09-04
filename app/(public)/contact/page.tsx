import type { Metadata } from "next";
import { PreparingPage } from "@/components/preparing-page";

export const metadata: Metadata = {
  title: "お問い合わせ・修正削除依頼",
  description: "空手道場ナビへのお問い合わせ(準備中)",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="お問い合わせ・修正削除依頼"
      note="お問い合わせフォームを準備しています。掲載内容の修正・削除のご依頼も、こちらで受け付ける予定です。"
    />
  );
}
