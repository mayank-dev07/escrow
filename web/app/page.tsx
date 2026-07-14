"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEscrows } from "@/lib/useEscrows";
import { EscrowCard } from "@/components/EscrowCard";
import { StatBar } from "@/components/StatBar";
import { TOKENS } from "@/lib/tokens";

type Filter = "all" | "mine" | "takeable";

export default function MarketplacePage() {
  const { data: escrows, isLoading, isError, refetch, isFetching } = useEscrows();
  const { publicKey } = useWallet();
  const [filter, setFilter] = useState<Filter>("all");

  const list = escrows ?? [];
  const filtered = list.filter((e) => {
    if (filter === "mine") return publicKey && e.maker.equals(publicKey);
    if (filter === "takeable") return !publicKey || !e.maker.equals(publicKey);
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All offers" },
    { key: "takeable", label: "Takeable" },
    { key: "mine", label: "My offers" },
  ];

  return (
    <div>
      <Hero />

      <div className="mt-10">
        <StatBar escrows={list} />
      </div>

      {/* Toolbar */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                "rounded-lg px-3 py-1.5 text-sm transition-colors " +
                (filter === f.key
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white")
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="btn-ghost px-3 py-1.5 text-sm"
        >
          <RefreshIcon spinning={isFetching} /> Refresh
        </button>

        <Link href="/create" className="btn-primary ml-auto px-4 py-2 text-sm">
          + New offer
        </Link>
      </div>

      {/* Grid */}
      <div className="mt-6">
        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <EmptyState
            title="Couldn't reach the network"
            body="The RPC request failed. Check your NEXT_PUBLIC_RPC_URL and try again."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              list.length === 0
                ? "No open offers yet"
                : "Nothing matches this filter"
            }
            body={
              list.length === 0
                ? "Be the first to lock some tokens and post a trade."
                : "Try a different filter above."
            }
            cta={list.length === 0}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((e) => (
                <EscrowCard key={e.address.toBase58()} escrow={e} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-lime" />
          Trustless peer-to-peer swaps · on-chain vault
        </span>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Swap tokens without <span className="neon-text">trusting</span> anyone.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/60">
          Lock your tokens in a program-owned vault and name your price. A taker
          pays exactly what you asked, or you pull your funds back with a refund.
          The code holds the funds — not a middleman.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/create" className="btn-primary px-6 py-3 text-base">
            Create an offer
          </Link>
          <a
            href="#offers"
            className="btn-ghost px-6 py-3 text-base"
            onClick={(e) => {
              e.preventDefault();
              window.scrollBy({ top: 400, behavior: "smooth" });
            }}
          >
            Browse the market
          </a>
        </div>
        {TOKENS.length < 2 && (
          <p className="mt-4 text-sm text-neon-magenta/80">
            Heads up: only one token is configured. Add demo mints to
            <code className="mx-1 rounded bg-black/40 px-1">.env.local</code>
            to enable real trades.
          </p>
        )}
      </motion.div>
      <div id="offers" />
    </section>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-40 animate-pulse p-5">
          <div className="h-10 w-2/3 rounded bg-white/5" />
          <div className="mt-6 h-8 w-full rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: boolean;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.02]">
        <svg width="28" height="28" viewBox="0 0 24 24" className="text-neon-violet">
          <path
            d="M4 7h16M4 12h16M4 17h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-white/50">{body}</p>
      {cta && (
        <Link href="/create" className="btn-primary mt-5 px-5 py-2.5">
          Create the first offer
        </Link>
      )}
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      className={spinning ? "animate-spin" : ""}
    >
      <path
        d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
