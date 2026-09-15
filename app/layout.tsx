import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "GamerHub",
  description: "Oyuncu bul, arkadaş ekle, sohbet et ve oyun daveti gönder."
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
