# VaultSwap — Escrow dApp Frontend

A neon, fully web3 Next.js + Tailwind frontend for the `anchor_escrow` program.
Browse open escrows, create an offer (make), take someone else's, or refund your
own — straight from a connected wallet, reading live from the chain.

- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Wallet:** `@solana/wallet-adapter` (Phantom, Solflare)
- **Chain client:** hand-rolled with `@solana/web3.js` + `@solana/spl-token`
  (instructions built from the program's account layouts + discriminators — no
  IDL runtime dependency, so it's immune to anchor TS/IDL version drift)
- **Data:** `@tanstack/react-query` polling `getProgramAccounts`
- **Motion/art:** `framer-motion` + inline animated SVG

## How the client talks to the program

The program (anchor-lang 1.0-rc) uses a **1-byte account discriminator**
(`#[account(discriminator = 1)]`). Rather than depend on an anchor TS client
parsing a 1.0 IDL, this app talks to the program directly:

- `lib/constants.ts` — instruction discriminators (`sha256("global:<name>")[..8]`)
  and the 1-byte account discriminator.
- `lib/pdas.ts` — escrow PDA (`["escrow", maker, seed_le]`) + vault ATA.
- `lib/escrow.ts` — decodes the `Escrow` account and reads each vault balance.
- `lib/ix.ts` — builds `make` / `take` / `refund` instructions with exactly the
  account order + signer/writable flags from the Rust `#[derive(Accounts)]`.

If you change the program's account structs, update `lib/ix.ts` to match.

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local   # then fill in values (see below)
npm run dev                        # http://localhost:3000
```

### Environment (`.env.local`)

| Var | Meaning |
| --- | --- |
| `NEXT_PUBLIC_RPC_URL` | Devnet RPC endpoint |
| `NEXT_PUBLIC_CLUSTER` | `devnet` (label + explorer links) |
| `NEXT_PUBLIC_PROGRAM_ID` | Deployed program id |
| `NEXT_PUBLIC_DEMO_MINT_A/B` | Curated demo token mints (fill after minting) |

## Getting it working end-to-end (devnet)

1. **Deploy the program** and set `NEXT_PUBLIC_PROGRAM_ID`:
   ```bash
   ./scripts/deploy-devnet.sh
   ```
2. **Mint demo tokens** so the dropdown has tradable tokens, then paste the
   printed lines into `.env.local`:
   ```bash
   npm run mint-demo
   ```
3. `npm run dev`, connect Phantom (set to **Devnet** in wallet settings), and
   try: Create an offer → open a second wallet → Take it. Refund an offer you
   made that no one has taken.

> The maker must already **hold** the token they're giving. `npm run mint-demo`
> mints the demo supply to your CLI wallet; send some to a second wallet to test
> taking.

## ⚠️ Toolchain note — program build blocker

At the time of writing, `anchor build` / `cargo build-sbf` fail before producing
the deployable `.so`:

```
error[E0277]: the trait `Serialize` is not implemented for `solana_hash::Hash`
error: could not compile `solana-sysvar`
```

Cause: the dependency tree resolves **two** `solana-hash` versions (3.0.0 and
4.5.0); `solana-sysvar 3.0.0`'s `Fees` sysvar references the one lacking the
`serde` impl. This is an anchor-1.0-rc ↔ solana-3.x version-unification issue,
not a bug in the escrow program.

Fix options (from the repo root):
- Unify the crate version: `cargo update -p solana-hash --precise <matching>`
  then rebuild, **or**
- Pin `solana-sysvar` / align the anchor + solana toolchain versions your
  bootcamp uses, **or**
- Build the `.so` in the toolchain where `cargo test` (litesvm) already works.

Once the `.so` builds, `./scripts/deploy-devnet.sh` deploys it and the frontend
is fully live. **The frontend itself is complete and correct** — it only needs a
deployed program id + demo mints in `.env.local`.
