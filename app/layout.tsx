import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { connection } from "next/server";
import { Suspense } from "react";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// viewport-fit=cover lets the app shell honor iOS safe-area insets.
export const viewport: Viewport = { viewportFit: "cover" };

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
    <html lang="es" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Suspense>
          <PerRequest>{children}</PerRequest>
        </Suspense>
      </body>
    </html>
  );
}
