/**
 * Send demo USDC + USDT from your CLI wallet to another wallet so it can trade.
 *
 *   npx tsx scripts/fund-wallet.ts <RECIPIENT_ADDRESS> [amount]
 *
 * Default amount is 1000 of each token. Recipient needs a little devnet SOL for
 * fees/rent (airdrop or send some separately).
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
} from "@solana/spl-token";

const RPC = "https://api.devnet.solana.com";
const DECIMALS = 6;
const TOKENS = [
  { sym: "USDC", mint: new PublicKey("7TANBHwMXdvgpYpvDeoqAb8g1NTJJSA7ggYWdUorKgrG") },
  { sym: "USDT", mint: new PublicKey("BRnXmMj638fQdPQdPwVoAQvbLvFEDfuycCcCEXfWRdwi") },
];

async function main() {
  const recipientStr = process.argv[2];
  if (!recipientStr) {
    console.error("Usage: npx tsx scripts/fund-wallet.ts <RECIPIENT_ADDRESS> [amount]");
    process.exit(1);
  }
  const recipient = new PublicKey(recipientStr);
  const whole = BigInt(process.argv[3] ?? "1000");

  const conn = new Connection(RPC, "confirmed");
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(readFileSync(join(homedir(), ".config/solana/id.json"), "utf8"))
    )
  );
  console.log("From:", payer.publicKey.toBase58());
  console.log("To:  ", recipient.toBase58());

  for (const t of TOKENS) {
    const src = await getOrCreateAssociatedTokenAccount(conn, payer, t.mint, payer.publicKey);
    const dst = await getOrCreateAssociatedTokenAccount(conn, payer, t.mint, recipient);
    const amount = whole * 10n ** BigInt(DECIMALS);
    await transfer(conn, payer, src.address, dst.address, payer, amount);
    console.log(`  sent ${whole} ${t.sym}`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
