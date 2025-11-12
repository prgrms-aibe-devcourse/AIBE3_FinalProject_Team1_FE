import type { Metadata } from "next";

import { Geist, Geist_Mono } from "next/font/google";

import { QueryProvider } from "@/lib/providers/query-provider";

import { GlobalLoading } from "@/components/ui/loading";
import { Toast } from "@/components/ui/toast";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

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
  title: "취밋",
  description: "P2P 취미 장비 대여 플랫폼",
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
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toast />
          <GlobalLoading />
        </QueryProvider>
      </body>
    </html>
  );
}
