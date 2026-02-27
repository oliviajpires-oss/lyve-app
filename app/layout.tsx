import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lyve — The Platform Artists Actually Deserve",
  description: "AI-powered live entertainment booking and content platform for DJs and venues.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
