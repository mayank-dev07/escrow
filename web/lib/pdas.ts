import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PROGRAM_ID } from "./constants";

/** u64 seed -> little-endian 8-byte buffer, matching `seed.to_le_bytes()`. */
export function seedToLeBytes(seed: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(seed);
  return buf;
}

/**
 * escrow PDA = ["escrow", maker, seed_le].
 * Mirrors seeds=[b"escrow", maker.key(), seed.to_le_bytes()] in make.rs.
 */
export function deriveEscrowPda(maker: PublicKey, seed: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), maker.toBuffer(), seedToLeBytes(seed)],
    PROGRAM_ID
  );
}

/**
 * The vault is the ATA of the escrow PDA for mint_a.
 * allowOwnerOffCurve=true because the owner is a PDA.
 */
export function deriveVault(
  escrow: PublicKey,
  mintA: PublicKey,
  tokenProgram: PublicKey
): PublicKey {
  return getAssociatedTokenAddressSync(mintA, escrow, true, tokenProgram);
}

export function deriveAta(
  mint: PublicKey,
  owner: PublicKey,
  tokenProgram: PublicKey,
  allowOwnerOffCurve = false
): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve, tokenProgram);
}
