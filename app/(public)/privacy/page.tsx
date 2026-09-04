import type { Metadata } from "next";
import { PreparingPage } from "@/components/preparing-page";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "空手道場ナビのプライバシーポリシー(準備中)",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="プライバシーポリシー"
      note="個人情報の取扱いについての方針を掲載予定です。体験・見学の申込み機能は、本ページの公開とあわせて提供を開始します。"
    />
  );
}
