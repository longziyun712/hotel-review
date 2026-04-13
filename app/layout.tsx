import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "花园酒店 · 住客评论",
  description: "花园酒店住客评论浏览与检索",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col bg-[#f7f5f0] text-[#2c2c2c] antialiased">
        {children}
      </body>
    </html>
  );
}
