import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "K-Fantasy AI | AI가 픽하고, 당신이 이긴다",
  description: "K리그 판타지 축구를 위한 AI 기반 선수 추천 및 팀 빌더 서비스",
  keywords: ["K리그", "판타지", "AI", "축구", "선수추천"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Sidebar />
        <main className="lg:ml-64 min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
          {children}
        </main>
      </body>
    </html>
  );
}
