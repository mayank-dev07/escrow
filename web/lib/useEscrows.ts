"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllEscrows, EscrowListing } from "./escrow";

export function useEscrows() {
  const { connection } = useConnection();
  return useQuery<EscrowListing[]>({
    queryKey: ["escrows", connection.rpcEndpoint],
    queryFn: () => fetchAllEscrows(connection),
    refetchInterval: 12_000,
    staleTime: 6_000,
  });
}
