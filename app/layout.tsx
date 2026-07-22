import type { Metadata } from "next";
import { Inter, Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const myeongjo = Nanum_Myeongjo({
  variable: "--font-myeongjo",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AQU.AI — All Questions Use Water",
  description:
    "AI에게 질문할 때마다 소모되는 물(냉각수) 사용량을 실시간으로 시각화하는 프롬프트 도우미",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${myeongjo.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
