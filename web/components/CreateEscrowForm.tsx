"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionInstruction } from "@solana/web3.js";
import { TOKENS, TokenInfo, toBaseUnits } from "@/lib/tokens";
import { buildMakeIx, randomSeed } from "@/lib/ix";
import { deriveAta } from "@/lib/pdas";
import { isNativeMint, wrapSolIxs, unwrapSolIx } from "@/lib/wsol";
import { useSendTx } from "@/lib/useSendTx";
import { TokenSelect } from "./TokenSelect";
import { TokenChip } from "./TokenChip";

export function CreateEscrowForm() {
  const { publicKey } = useWallet();
  const send = useSendTx();
  const qc = useQueryClient();
  const router = useRouter();

  const [give, setGive] = useState<TokenInfo>(TOKENS[0]);
  const [want, setWant] = useState<TokenInfo>(TOKENS[1] ?? TOKENS[0]);
  const [giveAmt, setGiveAmt] = useState("");
  const [wantAmt, setWantAmt] = useState("");
  const [busy, setBusy] = useState(false);

  const sameToken = give.mint.equals(want.mint);
  const validAmounts =
    Number(giveAmt) > 0 && Number(wantAmt) > 0 && !Number.isNaN(Number(giveAmt));
  const canSubmit = !!publicKey && !sameToken && validAmounts && !busy;

  async function submit() {
    if (!publicKey) return;
    setBusy(true);
    try {
      const depositAmount = toBaseUnits(giveAmt, give.decimals);
      const ixs: TransactionInstruction[] = [];

      // If giving native SOL, wrap the exact deposit into wSOL first so the
      // program can pull it into the vault.
      const givingSol = isNativeMint(give.mint);
      const makerAtaA = deriveAta(give.mint, publicKey, give.tokenProgram);
      if (givingSol) {
        ixs.push(...wrapSolIxs(publicKey, makerAtaA, depositAmount, give.tokenProgram));
      }

      ixs.push(
        buildMakeIx({
          maker: publicKey,
          seed: randomSeed(),
          mintA: give.mint,
          mintB: want.mint,
          tokenProgram: give.tokenProgram,
          depositAmount,
          receiveAmount: toBaseUnits(wantAmt, want.decimals),
        })
      );

      // The wSOL account is now empty (all deposited into the vault); close it
      // to reclaim its rent.
      if (givingSol) {
        ixs.push(unwrapSolIx(makerAtaA, publicKey, give.tokenProgram));
      }

      const sig = await send(ixs, "Creating offer");
      if (sig) {
        await qc.invalidateQueries({ queryKey: ["escrows"] });
        router.push("/");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mx-auto max-w-lg p-6 sm:p-8"
    >
      <h1 className="font-display text-2xl font-bold">Create an offer</h1>
      <p className="mt-1 text-sm text-white/50">
        Lock tokens in a vault. Anyone can take the trade, or you can refund it
        anytime before they do.
      </p>

      <div className="mt-6 space-y-4">
        {/* Give */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <TokenSelect label="You give" value={give} onChange={setGive} />
          <input
            className="input mt-3"
            inputMode="decimal"
            placeholder="0.0"
            value={giveAmt}
            onChange={(e) =>
              setGiveAmt(e.target.value.replace(/[^0-9.]/g, ""))
            }
          />
        </div>

        <div className="flex justify-center">
          <div className="rounded-full border border-white/10 bg-panel p-2 shadow-glow">
            <svg width="20" height="20" viewBox="0 0 20 20" className="text-neon-cyan">
              <path
                d="M10 3v14m0 0-4-4m4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Want */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <TokenSelect label="You want" value={want} onChange={setWant} />
          <input
            className="input mt-3"
            inputMode="decimal"
            placeholder="0.0"
            value={wantAmt}
            onChange={(e) =>
              setWantAmt(e.target.value.replace(/[^0-9.]/g, ""))
            }
          />
        </div>
      </div>

      {/* Summary */}
      {validAmounts && !sameToken && (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm">
          <TokenChip token={give} size={22} />
          <span className="font-medium">
            {giveAmt} {give.symbol}
          </span>
          <span className="text-neon-cyan">→</span>
          <TokenChip token={want} size={22} />
          <span className="font-medium">
            {wantAmt} {want.symbol}
          </span>
        </div>
      )}

      {sameToken && (
        <p className="mt-4 text-center text-sm text-neon-magenta">
          Pick two different tokens.
        </p>
      )}

      <button
        className="btn-primary mt-6 w-full py-3 text-base"
        disabled={!canSubmit}
        onClick={submit}
      >
        {!publicKey
          ? "Connect wallet to continue"
          : busy
          ? "Locking in vault…"
          : "Lock tokens & publish offer"}
      </button>

      <p className="mt-3 text-center text-xs text-white/35">
        You must already hold the token you&apos;re giving. Funds go into a
        program-owned vault — only a taker or your refund can move them.
      </p>
    </motion.div>
  );
}
