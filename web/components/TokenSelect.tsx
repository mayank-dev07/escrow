"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { TOKENS, TokenInfo } from "@/lib/tokens";
import { TokenChip } from "./TokenChip";

export function TokenSelect({
  value,
  onChange,
  exclude,
  label,
}: {
  value: TokenInfo;
  onChange: (t: TokenInfo) => void;
  exclude?: TokenInfo;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options = TOKENS.filter((t) => !exclude || !t.mint.equals(exclude.mint));

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-left transition-colors hover:border-white/20"
      >
        <TokenChip token={value} />
        <span className="flex flex-col">
          <span className="font-semibold">{value.symbol}</span>
          <span className="text-xs text-white/40">{value.name}</span>
        </span>
        <svg
          className={clsx(
            "ml-auto h-4 w-4 text-white/40 transition-transform",
            open && "rotate-180"
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5 8l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-panel/95 shadow-glow-violet backdrop-blur-xl">
          {options.map((t) => (
            <button
              key={t.mint.toBase58()}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
            >
              <TokenChip token={t} size={30} />
              <span className="flex flex-col">
                <span className="font-medium">{t.symbol}</span>
                <span className="text-xs text-white/40">{t.name}</span>
              </span>
            </button>
          ))}
          {options.length === 0 && (
            <p className="px-3 py-3 text-sm text-white/40">
              No other tokens configured.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
