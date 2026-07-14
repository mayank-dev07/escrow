import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Backdrop } from "@/components/Backdrop";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "VaultSwap — Trustless Token Escrow on Solana",
  description:
    "Lock tokens in an on-chain vault and swap them peer-to-peer. Make an offer, take someone else's, or refund your own — no middleman.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Backdrop />
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
