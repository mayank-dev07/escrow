#!/usr/bin/env bash
# Deploy the escrow program to devnet.
# Run from the repo root AFTER the program .so is built (see README toolchain note).
set -euo pipefail

cd "$(dirname "$0")/../.."

SO=target/deploy/anchor_escrow.so
KEYPAIR=target/deploy/anchor_escrow-keypair.json

if [ ! -f "$SO" ]; then
  echo "Missing $SO — build the program first (anchor build / cargo build-sbf)."
  echo "See web/README.md 'Toolchain note' for the build fix."
  exit 1
fi

echo "Switching CLI to devnet…"
solana config set --url https://api.devnet.solana.com >/dev/null

echo "Wallet: $(solana address)"
echo "Balance: $(solana balance)"

# Deploy needs a few SOL. Airdrop if we're short (devnet faucet may rate-limit).
solana airdrop 2 || echo "Airdrop skipped/failed — fund the wallet manually if deploy fails."

echo "Deploying $SO …"
solana program deploy "$SO" --program-id "$KEYPAIR"

echo "Deployed program id: $(solana address -k "$KEYPAIR")"
echo "Set NEXT_PUBLIC_PROGRAM_ID to that value in web/.env.local"
