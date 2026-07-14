"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { WalletButton } from "./WalletButton";
import { CLUSTER } from "@/lib/constants";

export function Navbar() {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Marketplace" },
    { href: "/create", label: "Create Offer" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/5  backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-lg font-bold tracking-tight">
            Vault<span className="neon-text">Swap</span>
          </span>
        </Link>

        <span className="hidden rounded-full border border-neon-lime/30 bg-neon-lime/10 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-neon-lime sm:inline">
          {CLUSTER}
        </span>

        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === l.href
                  ? "text-white bg-white/5"
                  : "text-white/60 hover:text-white"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto sm:ml-2">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#a6c8ff" />
          <stop offset="1" stopColor="#5227ff" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="26"
        height="26"
        rx="8"
        stroke="url(#lg)"
        strokeWidth="2"
        className="transition-all group-hover:stroke-[3]"
      />
      <circle cx="16" cy="16" r="5" fill="url(#lg)">
        <animate
          attributeName="r"
          values="4;5.5;4"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
