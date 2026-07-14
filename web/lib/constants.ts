import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    "5RjVJ6NfxT2XL7fzDbGzvNdbze4MF9NPTSe4xgoLFGna"
);

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER ?? "devnet") as
  | "devnet"
  | "mainnet-beta"
  | "testnet";

// Anchor instruction discriminators = sha256("global:<name>")[..8].
// Precomputed so the client needs no IDL at runtime.
export const IX_DISCRIMINATOR = {
  make: Uint8Array.from([138, 227, 232, 77, 223, 166, 96, 197]),
  take: Uint8Array.from([149, 226, 52, 104, 6, 142, 230, 39]),
  refund: Uint8Array.from([2, 96, 183, 251, 63, 208, 46, 46]),
} as const;

// This program declares `#[account(discriminator = 1)]` on Escrow (anchor 1.0),
// so the account data begins with a single byte `1` instead of the classic
// 8-byte hash discriminator.
export const ESCROW_ACCOUNT_DISCRIMINATOR = Uint8Array.from([1]);

export const EXPLORER_CLUSTER_SUFFIX =
  CLUSTER === "mainnet-beta" ? "" : `?cluster=${CLUSTER}`;

export function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}${EXPLORER_CLUSTER_SUFFIX}`;
}

export function explorerAddress(addr: string): string {
  return `https://explorer.solana.com/address/${addr}${EXPLORER_CLUSTER_SUFFIX}`;
}
