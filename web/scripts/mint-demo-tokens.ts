/**
 * Creates two demo SPL tokens on devnet and mints a supply to your local
 * wallet, so the token dropdown has something real to trade.
 *
 *   npm run mint-demo
 *
 * Then copy the printed NEXT_PUBLIC_DEMO_MINT_* lines into web/.env.local.
 *
 * Uses your Solana CLI wallet (~/.config/solana/id.json by default; override
 * with SOLANA_KEYPAIR=/path/to/keypair.json).
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

const RPC = process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl("devnet");
const DECIMALS = 6;
const SUPPLY = 1_000_000; // whole tokens minted to your wallet

function loadWallet(): Keypair {
  const path =
    process.env.SOLANA_KEYPAIR ?? join(homedir(), ".config/solana/id.json");
  const secret = JSON.parse(readFileSync(path, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function ensureFunds(conn: Connection, payer: Keypair) {
  const bal = await conn.getBalance(payer.publicKey);
  if (bal >= 0.2 * LAMPORTS_PER_SOL) return;
  console.log("Low balance, requesting a devnet airdrop…");
  try {
    const sig = await conn.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig, "confirmed");
  } catch {
    console.warn(
      "Airdrop failed (devnet faucet is often rate-limited). Fund the wallet manually and re-run."
    );
  }
}

async function makeToken(
  conn: Connection,
  payer: Keypair,
  label: string
): Promise<string> {
  const mint = await createMint(
    conn,
    payer,
    payer.publicKey,
    null,
    DECIMALS
  );
  const ata = await getOrCreateAssociatedTokenAccount(
    conn,
    payer,
    mint,
    payer.publicKey
  );
  await mintTo(
    conn,
    payer,
    mint,
    ata.address,
    payer,
    BigInt(SUPPLY) * 10n ** BigInt(DECIMALS)
  );
  console.log(`  ${label}: ${mint.toBase58()}`);
  return mint.toBase58();
}

async function main() {
  const conn = new Connection(RPC, "confirmed");
  const payer = loadWallet();
  console.log("Wallet:", payer.publicKey.toBase58());
  console.log("RPC:", RPC);

  await ensureFunds(conn, payer);

  console.log("Creating demo mints…");
  const a = await makeToken(conn, payer, "DUSD (mint A)");
  const b = await makeToken(conn, payer, "DGLD (mint B)");

  console.log("\nDone! Add these to web/.env.local:\n");
  console.log(`NEXT_PUBLIC_DEMO_MINT_A=${a}`);
  console.log(`NEXT_PUBLIC_DEMO_MINT_A_SYMBOL=DUSD`);
  console.log(`NEXT_PUBLIC_DEMO_MINT_A_DECIMALS=${DECIMALS}`);
  console.log(`NEXT_PUBLIC_DEMO_MINT_B=${b}`);
  console.log(`NEXT_PUBLIC_DEMO_MINT_B_SYMBOL=DGLD`);
  console.log(`NEXT_PUBLIC_DEMO_MINT_B_DECIMALS=${DECIMALS}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
