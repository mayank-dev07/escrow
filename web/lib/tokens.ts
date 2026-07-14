import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: PublicKey;
  decimals: number;
  /** Two-letter badge + gradient used for the SVG token chip. */
  gradient: [string, string];
  tokenProgram: PublicKey;
}

// Wrapped SOL exists on every cluster with the same address.
export const WSOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);

function envMint(v?: string): PublicKey | null {
  if (!v) return null;
  try {
    return new PublicKey(v);
  } catch {
    return null;
  }
}

const demoA = envMint(process.env.NEXT_PUBLIC_DEMO_MINT_A);
const demoB = envMint(process.env.NEXT_PUBLIC_DEMO_MINT_B);

/**
 * Curated token list for the trade dropdowns. These are real SPL tokens on
 * devnet that the connected wallet actually holds, so trades execute. Set their
 * mints in .env.local (fill them after running `npm run mint-demo`).
 *
 * Note: we deliberately omit Wrapped SOL — trading it requires wrapping native
 * SOL into a wSOL token account first, which this UI doesn't do, so it would
 * fail at `make`. Only list tokens the user holds a balance of.
 */
export const TOKENS: TokenInfo[] = [
  {
    symbol: "SOL",
    name: "Solana",
    mint: NATIVE_MINT, // native SOL; the app auto-wraps/unwraps to wSOL
    decimals: 9,
    gradient: ["#9945ff", "#14f195"], // Solana brand
    tokenProgram: TOKEN_PROGRAM_ID,
  },
  ...(demoA
    ? [
        {
          symbol: process.env.NEXT_PUBLIC_DEMO_MINT_A_SYMBOL ?? "USDC",
          name: "USD Coin (devnet)",
          mint: demoA,
          decimals: Number(process.env.NEXT_PUBLIC_DEMO_MINT_A_DECIMALS ?? 6),
          gradient: ["#2775ca", "#4f95e0"] as [string, string], // USDC brand blue
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      ]
    : []),
  ...(demoB
    ? [
        {
          symbol: process.env.NEXT_PUBLIC_DEMO_MINT_B_SYMBOL ?? "USDT",
          name: "Tether USD (devnet)",
          mint: demoB,
          decimals: Number(process.env.NEXT_PUBLIC_DEMO_MINT_B_DECIMALS ?? 6),
          gradient: ["#26a17b", "#4fc79b"] as [string, string], // USDT brand green
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      ]
    : []),
];

export function findToken(mint: PublicKey): TokenInfo | undefined {
  return TOKENS.find((t) => t.mint.equals(mint));
}

/** Fallback descriptor for a mint we don't have in the curated list. */
export function unknownToken(mint: PublicKey): TokenInfo {
  const s = mint.toBase58();
  return {
    symbol: `${s.slice(0, 4)}…${s.slice(-4)}`,
    name: "Unknown token",
    mint,
    decimals: 0,
    gradient: ["#4a5590", "#232a52"],
    tokenProgram: TOKEN_PROGRAM_ID,
  };
}

export function tokenFor(mint: PublicKey): TokenInfo {
  return findToken(mint) ?? unknownToken(mint);
}

/** Convert a UI amount (e.g. "1.5") into base units as a bigint. */
export function toBaseUnits(amount: string, decimals: number): bigint {
  const [whole, frac = ""] = amount.trim().split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const digits = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "");
  return BigInt(digits || "0");
}

/** Format base units into a human string with the token's decimals. */
export function fromBaseUnits(
  raw: bigint | number,
  decimals: number,
  maxFrac = 6
): string {
  const v = typeof raw === "number" ? BigInt(raw) : raw;
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  let fracStr = frac
    .toString()
    .padStart(decimals, "0")
    .slice(0, maxFrac)
    .replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole.toString()}${fracStr ? "." + fracStr : ""}`;
}
