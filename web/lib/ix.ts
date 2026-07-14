import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  AccountMeta,
} from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { IX_DISCRIMINATOR, PROGRAM_ID } from "./constants";
import { deriveEscrowPda, deriveVault, deriveAta } from "./pdas";
import type { EscrowListing } from "./escrow";

function u64(v: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(v);
  return b;
}

function meta(pubkey: PublicKey, isSigner: boolean, isWritable: boolean): AccountMeta {
  return { pubkey, isSigner, isWritable };
}

/** Cryptographically-random u64 seed for a new escrow. */
export function randomSeed(): bigint {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let v = 0n;
  for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(bytes[i]);
  return v;
}

export interface MakeParams {
  maker: PublicKey;
  seed: bigint;
  mintA: PublicKey;
  mintB: PublicKey;
  tokenProgram: PublicKey;
  depositAmount: bigint; // mint_a base units the maker locks
  receiveAmount: bigint; // mint_b base units the maker wants
}

export function buildMakeIx(p: MakeParams): TransactionInstruction {
  const [escrow] = deriveEscrowPda(p.maker, p.seed);
  const vault = deriveVault(escrow, p.mintA, p.tokenProgram);
  const makerAtaA = deriveAta(p.mintA, p.maker, p.tokenProgram);

  // handler order: make(seed, receive, amount)
  const data = Buffer.concat([
    Buffer.from(IX_DISCRIMINATOR.make),
    u64(p.seed),
    u64(p.receiveAmount),
    u64(p.depositAmount),
  ]);

  const keys: AccountMeta[] = [
    meta(p.maker, true, true),
    meta(escrow, false, true),
    meta(p.mintA, false, false),
    meta(p.mintB, false, false),
    meta(makerAtaA, false, true),
    meta(vault, false, true),
    meta(ASSOCIATED_TOKEN_PROGRAM_ID, false, false),
    meta(p.tokenProgram, false, false),
    meta(SystemProgram.programId, false, false),
  ];

  return new TransactionInstruction({ programId: PROGRAM_ID, keys, data });
}

export function buildTakeIx(
  taker: PublicKey,
  e: EscrowListing,
  tokenProgram: PublicKey
): TransactionInstruction {
  const vault = deriveVault(e.address, e.mintA, tokenProgram);
  const takerAtaA = deriveAta(e.mintA, taker, tokenProgram);
  const takerAtaB = deriveAta(e.mintB, taker, tokenProgram);
  const makerAtaB = deriveAta(e.mintB, e.maker, tokenProgram);

  const data = Buffer.from(IX_DISCRIMINATOR.take);

  const keys: AccountMeta[] = [
    meta(taker, true, true),
    meta(e.maker, false, true),
    meta(e.address, false, true),
    meta(e.mintA, false, false),
    meta(e.mintB, false, false),
    meta(vault, false, true),
    meta(takerAtaA, false, true),
    meta(takerAtaB, false, true),
    meta(makerAtaB, false, true),
    meta(ASSOCIATED_TOKEN_PROGRAM_ID, false, false),
    meta(tokenProgram, false, false),
    meta(SystemProgram.programId, false, false),
  ];

  return new TransactionInstruction({ programId: PROGRAM_ID, keys, data });
}

export function buildRefundIx(
  maker: PublicKey,
  e: EscrowListing,
  tokenProgram: PublicKey
): TransactionInstruction {
  const vault = deriveVault(e.address, e.mintA, tokenProgram);
  const makerAtaA = deriveAta(e.mintA, maker, tokenProgram);

  const data = Buffer.from(IX_DISCRIMINATOR.refund);

  const keys: AccountMeta[] = [
    meta(maker, true, true),
    meta(e.address, false, true),
    meta(e.mintA, false, false),
    meta(vault, false, true),
    meta(makerAtaA, false, true),
    meta(ASSOCIATED_TOKEN_PROGRAM_ID, false, false),
    meta(tokenProgram, false, false),
    meta(SystemProgram.programId, false, false),
  ];

  return new TransactionInstruction({ programId: PROGRAM_ID, keys, data });
}
