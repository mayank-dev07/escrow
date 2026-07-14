"use client";

import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionInstruction } from "@solana/web3.js";
import { EscrowListing } from "@/lib/escrow";
import { tokenFor, fromBaseUnits } from "@/lib/tokens";
import { buildTakeIx, buildRefundIx } from "@/lib/ix";
import { deriveAta } from "@/lib/pdas";
import { isNativeMint, wrapSolIxs, unwrapSolIx } from "@/lib/wsol";
import { useSendTx } from "@/lib/useSendTx";
import { explorerAddress } from "@/lib/constants";
import { TokenChip } from "./TokenChip";

export const EscrowCard = forwardRef<HTMLDivElement, { escrow: EscrowListing }>(
  function EscrowCard({ escrow }, ref) {
  const { publicKey } = useWallet();
  const send = useSendTx();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const give = tokenFor(escrow.mintA);
  const want = tokenFor(escrow.mintB);
  const isMine = publicKey?.equals(escrow.maker) ?? false;
  const tokenProgram = give.tokenProgram;

  async function act(kind: "take" | "refund") {
    if (!publicKey) return;
    setBusy(true);
    try {
      const ixs: TransactionInstruction[] = [];
      const givesSol = isNativeMint(escrow.mintA); // vault holds wSOL
      const wantsSol = isNativeMint(escrow.mintB); // payment is in wSOL

      if (kind === "take") {
        // Paying in SOL → wrap the requested amount into wSOL first.
        if (wantsSol) {
          const takerAtaB = deriveAta(escrow.mintB, publicKey, tokenProgram);
          ixs.push(...wrapSolIxs(publicKey, takerAtaB, escrow.receive, tokenProgram));
        }
        ixs.push(buildTakeIx(publicKey, escrow, tokenProgram));
        // Received wSOL from the vault → unwrap it back to native SOL.
        if (givesSol) {
          const takerAtaA = deriveAta(escrow.mintA, publicKey, tokenProgram);
          ixs.push(unwrapSolIx(takerAtaA, publicKey, tokenProgram));
        }
      } else {
        ixs.push(buildRefundIx(publicKey, escrow, tokenProgram));
        // Got wSOL back from the vault → unwrap to native SOL.
        if (givesSol) {
          const makerAtaA = deriveAta(escrow.mintA, publicKey, tokenProgram);
          ixs.push(unwrapSolIx(makerAtaA, publicKey, tokenProgram));
        }
      }

      const label = kind === "take" ? "Taking offer" : "Refunding offer";
      const sig = await send(ixs, label);
      if (sig) await qc.invalidateQueries({ queryKey: ["escrows"] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="card group relative overflow-hidden p-5"
    >
      {/* hover glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(400px_circle_at_var(--x,50%)_0%,rgba(82,39,255,0.18),transparent)]" />

      {isMine && (
        <span className="absolute right-4 top-4 rounded-full border border-neon-lime/30 bg-neon-lime/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neon-lime">
          Yours
        </span>
      )}

      {/* Give → Want */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <TokenChip token={give} />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Giving
            </p>
            <p className="font-display text-lg font-bold leading-none">
              {fromBaseUnits(escrow.deposited, give.decimals)}{" "}
              <span className="text-sm font-medium text-white/60">
                {give.symbol}
              </span>
            </p>
          </div>
        </div>

        <SwapArrow />

        <div className="flex items-center gap-2.5">
          <TokenChip token={want} />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Wants
            </p>
            <p className="font-display text-lg font-bold leading-none">
              {fromBaseUnits(escrow.receive, want.decimals)}{" "}
              <span className="text-sm font-medium text-white/60">
                {want.symbol}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <a
          href={explorerAddress(escrow.address.toBase58())}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-white/35 transition-colors hover:text-neon-cyan"
        >
          {escrow.address.toBase58().slice(0, 4)}…
          {escrow.address.toBase58().slice(-4)}
        </a>

        {isMine ? (
          <button
            className="btn-danger px-4 py-2 text-sm"
            disabled={busy}
            onClick={() => act("refund")}
          >
            {busy ? "…" : "Refund"}
          </button>
        ) : (
          <button
            className="btn-primary px-4 py-2 text-sm"
            disabled={busy || !publicKey}
            onClick={() => act("take")}
          >
            {busy ? "…" : publicKey ? "Take offer" : "Connect wallet"}
          </button>
        )}
      </div>
    </motion.div>
  );
});

function SwapArrow() {
  return (
    <svg
      width="34"
      height="24"
      viewBox="0 0 34 24"
      fill="none"
      className="mx-1 shrink-0 text-neon-cyan/70"
    >
      <path
        d="M2 8h26m0 0-6-6m6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="stroke-opacity"
          values="0.4;1;0.4"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
