"use client";

import { EscrowListing } from "@/lib/escrow";

export function StatBar({ escrows }: { escrows: EscrowListing[] }) {
  const makers = new Set(escrows.map((e) => e.maker.toBase58())).size;
  const pairs = new Set(
    escrows.map((e) => `${e.mintA.toBase58()}/${e.mintB.toBase58()}`)
  ).size;

  const stats = [
    { label: "Open offers", value: escrows.length },
    { label: "Makers", value: makers },
    { label: "Token pairs", value: pairs },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:max-w-md">
      {stats.map((s) => (
        <div key={s.label} className="card px-4 py-3 text-center">
          <p className="font-display text-2xl font-bold neon-text">{s.value}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
