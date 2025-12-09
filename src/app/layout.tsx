import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import { QueryProvider } from "@/lib/providers/query-provider";

import { GlobalLoading } from "@/components/ui/loading";
import { Toast } from "@/components/ui/toast";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

import { ChatRoomsProvider } from "@/components/chat/ChatRoomsProvider";
import { NotificationSSEProvider } from "@/components/notification/NotificationSSEProvider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHWI·MEET | 취미를 만나다",
  description:
    "P2P 기반 취미 장비 대여 플랫폼, 필요한 장비를 안전하게 빌려보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <NotificationSSEProvider />
          <ChatRoomsProvider />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-gray-50">{children}</main>
            <Footer />
          </div>
          <Toast />
          <GlobalLoading />
        </QueryProvider>
      </body>
    </html>
  );
}
