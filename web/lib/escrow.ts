import {
  Connection,
  PublicKey,
  AccountInfo,
  GetProgramAccountsFilter,
} from "@solana/web3.js";
import { unpackAccount } from "@solana/spl-token";
import { PROGRAM_ID } from "./constants";
import { deriveVault } from "./pdas";
import { tokenFor } from "./tokens";

/**
 * On-chain Escrow account (state.rs), laid out after the 1-byte discriminator:
 *   seed: u64 | maker: Pubkey | mint_a: Pubkey | mint_b: Pubkey | receive: u64 | bump: u8
 */
export interface EscrowAccount {
  address: PublicKey;
  seed: bigint;
  maker: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  receive: bigint; // amount of mint_b the maker wants (base units)
  bump: number;
}

export const ESCROW_DATA_LEN = 1 + 8 + 32 + 32 + 32 + 8 + 1; // 114

export function decodeEscrow(address: PublicKey, data: Buffer): EscrowAccount | null {
  if (data.length < ESCROW_DATA_LEN) return null;
  if (data[0] !== 1) return null; // discriminator = 1
  let o = 1;
  const seed = data.readBigUInt64LE(o);
  o += 8;
  const maker = new PublicKey(data.subarray(o, o + 32));
  o += 32;
  const mintA = new PublicKey(data.subarray(o, o + 32));
  o += 32;
  const mintB = new PublicKey(data.subarray(o, o + 32));
  o += 32;
  const receive = data.readBigUInt64LE(o);
  o += 8;
  const bump = data[o];
  return { address, seed, maker, mintA, mintB, receive, bump };
}

/** A marketplace row: the escrow plus the live amount locked in its vault. */
export interface EscrowListing extends EscrowAccount {
  vault: PublicKey;
  deposited: bigint; // amount of mint_a currently in the vault (base units)
}

export async function fetchAllEscrows(
  connection: Connection
): Promise<EscrowListing[]> {
  const filters: GetProgramAccountsFilter[] = [
    { dataSize: ESCROW_DATA_LEN },
    { memcmp: { offset: 0, bytes: "2" } }, // base58("[1]") === "2"
  ];

  const accounts = await connection.getProgramAccounts(PROGRAM_ID, { filters });
  const escrows = accounts
    .map(({ pubkey, account }) => decodeEscrow(pubkey, account.data as Buffer))
    .filter((e): e is EscrowAccount => e !== null);

  if (escrows.length === 0) return [];

  // Resolve each escrow's vault and read the deposited balance in one batch.
  const vaults = escrows.map((e) =>
    deriveVault(e.address, e.mintA, tokenFor(e.mintA).tokenProgram)
  );

  const vaultInfos = await getMultipleAccountsChunked(connection, vaults);

  return escrows.map((e, i) => {
    const vault = vaults[i];
    const info = vaultInfos[i];
    let deposited = 0n;
    if (info) {
      try {
        deposited = unpackAccount(vault, info, tokenFor(e.mintA).tokenProgram).amount;
      } catch {
        deposited = 0n;
      }
    }
    return { ...e, vault, deposited };
  });
}

async function getMultipleAccountsChunked(
  connection: Connection,
  keys: PublicKey[]
): Promise<(AccountInfo<Buffer> | null)[]> {
  const out: (AccountInfo<Buffer> | null)[] = [];
  for (let i = 0; i < keys.length; i += 100) {
    const chunk = keys.slice(i, i + 100);
    const infos = await connection.getMultipleAccountsInfo(chunk);
    out.push(...infos);
  }
  return out;
}
