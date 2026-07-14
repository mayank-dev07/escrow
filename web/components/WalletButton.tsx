"use client";

import dynamic from "next/dynamic";

// Wallet button touches browser-only APIs; load it client-side only to avoid
// SSR/hydration mismatches.
export const WalletButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false, loading: () => <div className="h-10 w-40 rounded-xl glass animate-pulse" /> }
);
