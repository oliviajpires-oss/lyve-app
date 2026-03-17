import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm", weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Lyve — The Platform Artists Actually Deserve",
  description: "AI-powered live entertainment booking and content platform for DJs and venues.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>{children}</body>
    </html>
  );
}
