/**
 * Create an escrow offer from your CLI wallet: give USDC, want SOL.
 * A browser wallet can then TAKE it by paying SOL (which every wallet has) and
 * receive USDC — no pre-funding of the taker needed.
 *
 *   npx tsx scripts/make-offer.ts
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { buildMakeIx, randomSeed } from "../lib/ix";

const USDC = new PublicKey("7TANBHwMXdvgpYpvDeoqAb8g1NTJJSA7ggYWdUorKgrG");
const GIVE_USDC = 50n * 10n ** 6n; // 50 USDC into the vault
const WANT_SOL = 100_000_000n; // 0.1 SOL requested

async function main() {
  const conn = new Connection("https://api.devnet.solana.com", "confirmed");
  const maker = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(readFileSync(join(homedir(), ".config/solana/id.json"), "utf8"))
    )
  );

  const ix = buildMakeIx({
    maker: maker.publicKey,
    seed: randomSeed(),
    mintA: USDC, // giving USDC
    mintB: NATIVE_MINT, // want SOL
    tokenProgram: TOKEN_PROGRAM_ID,
    depositAmount: GIVE_USDC,
    receiveAmount: WANT_SOL,
  });

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(conn, tx, [maker], {
    commitment: "confirmed",
  });
  console.log("Offer created: give 50 USDC → want 0.1 SOL");
  console.log("maker:", maker.publicKey.toBase58());
  console.log("sig:", sig);
}

main().catch((e) => {
  console.error(e?.logs ?? e);
  process.exit(1);
});
