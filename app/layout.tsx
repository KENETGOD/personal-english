import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import { Suspense } from "react";
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
  title: "English Coach",
  description: "Práctica diaria de inglés",
};

// The per-request CSP nonce (proxy.ts) can only be applied to dynamically rendered pages.
async function PerRequest({ children }: { children: React.ReactNode }) {
  await connection();
  return children;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense>
          <PerRequest>{children}</PerRequest>
        </Suspense>
      </body>
    </html>
  );
}
