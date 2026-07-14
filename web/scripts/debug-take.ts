/** Simulate a `take` against a live devnet escrow and print program logs. */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { fetchAllEscrows } from "../lib/escrow";
import { buildTakeIx } from "../lib/ix";
import { isNativeMint, wrapSolIxs, unwrapSolIx } from "../lib/wsol";
import { deriveAta } from "../lib/pdas";

async function main() {
  const conn = new Connection("https://api.devnet.solana.com", "confirmed");
  const taker = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(readFileSync(join(homedir(), ".config/solana/id.json"), "utf8"))
    )
  );
  console.log("Taker (CLI wallet):", taker.publicKey.toBase58());

  const escrows = await fetchAllEscrows(conn);
  console.log(`\n${escrows.length} escrow(s) on devnet:`);
  for (const e of escrows) {
    console.log(
      `  ${e.address.toBase58()} | maker ${e.maker
        .toBase58()
        .slice(0, 6)} | give ${e.mintA.toBase58().slice(0, 6)} x${e.deposited} | want ${e.mintB
        .toBase58()
        .slice(0, 6)} x${e.receive}`
    );
  }
  if (!escrows.length) return console.log("No escrows to take.");

  const e = escrows[0];
  const tp = TOKEN_PROGRAM_ID;
  const ixs: TransactionInstruction[] = [];
  if (isNativeMint(e.mintB))
    ixs.push(...wrapSolIxs(taker.publicKey, deriveAta(e.mintB, taker.publicKey, tp), e.receive, tp));
  ixs.push(buildTakeIx(taker.publicKey, e, tp));
  if (isNativeMint(e.mintA))
    ixs.push(unwrapSolIx(deriveAta(e.mintA, taker.publicKey, tp), taker.publicKey, tp));

  const tx = new Transaction().add(...ixs);
  tx.feePayer = taker.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

  console.log(`\nSimulating take of ${e.address.toBase58()} …`);
  const sim = await conn.simulateTransaction(tx);
  console.log("err:", JSON.stringify(sim.value.err));
  console.log("logs:\n" + (sim.value.logs || []).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
