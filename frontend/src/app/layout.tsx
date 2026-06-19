import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthInit } from "@/providers/auth-init";
import { QueryProvider } from "@/providers/query-provider";

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
  title: "TTJ Platforma — Talabalar uchun ijara",
  description:
    "O'zbekistondagi talabalar uchun xavfsiz va qulay uy ijarasi platformasi. HEMIS bilan integratsiyalashgan, kuratorlar nazoratidagi tizim.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthInit />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
