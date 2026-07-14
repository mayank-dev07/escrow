import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  NATIVE_MINT,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";

/** The native SOL mint (So111…112). A wSOL token account wraps native SOL. */
export const NATIVE_SOL_MINT = NATIVE_MINT;

export function isNativeMint(mint: PublicKey): boolean {
  return mint.equals(NATIVE_MINT);
}

/**
 * Instructions that turn `lamports` of native SOL into a wSOL balance owned by
 * `owner`, in the associated token account `ata`:
 *   1. create the wSOL ATA if missing (idempotent)
 *   2. move native SOL into it
 *   3. sync so the token balance reflects the deposited lamports
 */
export function wrapSolIxs(
  owner: PublicKey,
  ata: PublicKey,
  lamports: bigint,
  tokenProgram: PublicKey
): TransactionInstruction[] {
  return [
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      ata,
      owner,
      NATIVE_MINT,
      tokenProgram
    ),
    SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey: ata,
      lamports,
    }),
    createSyncNativeInstruction(ata, tokenProgram),
  ];
}

/**
 * Closing a wSOL account unwraps it: the token balance + rent are returned to
 * `owner` as native SOL.
 */
export function unwrapSolIx(
  ata: PublicKey,
  owner: PublicKey,
  tokenProgram: PublicKey
): TransactionInstruction {
  return createCloseAccountInstruction(ata, owner, owner, [], tokenProgram);
}
