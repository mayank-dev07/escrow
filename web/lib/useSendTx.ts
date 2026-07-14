"use client";

import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { toast } from "sonner";
import { explorerTx } from "./constants";

// Anchor custom error codes (errors.rs) start at 6000 in declaration order.
const ANCHOR_ERRORS: Record<number, string> = {
  6000: "Invalid amount",
  6001: "Invalid maker",
  6002: "Invalid mint A",
  6003: "Invalid mint B",
};

/** Turn a simulation error + logs into a human-readable reason. */
function friendlyError(err: unknown, logs: string[] | null): string {
  const joined = (logs ?? []).join("\n");

  if (/insufficient (funds|lamports)/i.test(joined)) {
    return "Insufficient balance — the connected wallet doesn't hold enough of the token to complete this trade.";
  }
  if (/insufficient funds for rent/i.test(joined)) {
    return "Not enough SOL to cover account rent + fees. Airdrop some devnet SOL and retry.";
  }
  if (/AccountNotFound/i.test(JSON.stringify(err))) {
    return "Your wallet has no account for the token this offer wants — it's never held that token. Get some of it first (fund this wallet), then retry.";
  }

  // Anchor custom program error → map to our error names.
  const m = JSON.stringify(err).match(/"Custom":(\d+)/);
  if (m) {
    const code = Number(m[1]);
    if (ANCHOR_ERRORS[code]) return `Program error: ${ANCHOR_ERRORS[code]}`;
    return `Program error (custom ${code}). ${lastProgramLog(logs)}`;
  }

  return lastProgramLog(logs) || `Simulation failed: ${JSON.stringify(err)}`;
}

function lastProgramLog(logs: string[] | null): string {
  const err = (logs ?? [])
    .filter((l) => /Error|failed|insufficient/i.test(l))
    .pop();
  return err ?? "";
}

/**
 * Returns a function that packages instructions into a transaction, has the
 * connected wallet sign+send it, waits for confirmation, and surfaces toasts.
 */
export function useSendTx() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  return useCallback(
    async (
      instructions: TransactionInstruction[],
      label: string
    ): Promise<string | null> => {
      if (!publicKey) {
        toast.error("Connect a wallet first");
        return null;
      }

      const toastId = toast.loading(`${label}…`);
      try {
        const tx = new Transaction();
        // A little headroom for the init_if_needed ATA creations.
        tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 250_000 }));
        instructions.forEach((ix) => tx.add(ix));

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.feePayer = publicKey;
        tx.recentBlockhash = blockhash;

        // Simulate first so we surface the real on-chain reason instead of the
        // wallet's opaque "Internal error" when preflight fails.
        const sim = await connection.simulateTransaction(tx);
        if (sim.value.err) {
          throw new Error(friendlyError(sim.value.err, sim.value.logs));
        }

        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(
          { signature: sig, blockhash, lastValidBlockHeight },
          "confirmed"
        );

        toast.success(`${label} confirmed`, {
          id: toastId,
          description: "View on Solana Explorer",
          action: {
            label: "Explorer",
            onClick: () => window.open(explorerTx(sig), "_blank"),
          },
        });
        return sig;
      } catch (err: any) {
        const msg =
          err?.message?.replace(/^Error: /, "") ?? "Transaction failed";
        toast.error(`${label} failed`, { id: toastId, description: msg });
        return null;
      }
    },
    [connection, publicKey, sendTransaction]
  );
}
