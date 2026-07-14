import type { TokenInfo } from "@/lib/tokens";

/** Circular gradient badge with the token's first two letters. */
export function TokenChip({
  token,
  size = 34,
}: {
  token: TokenInfo;
  size?: number;
}) {
  const id = `tg-${token.symbol}-${token.mint.toBase58().slice(0, 4)}`;
  const initials = token.symbol.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40">
          <stop stopColor={token.gradient[0]} />
          <stop offset="1" stopColor={token.gradient[1]} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#${id})`} opacity="0.9" />
      <circle
        cx="20"
        cy="20"
        r="19"
        fill="none"
        stroke="white"
        strokeOpacity="0.25"
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={initials.length >= 4 ? 9.5 : initials.length === 3 ? 11 : 13}
        fontWeight="700"
        fill="#03051a"
        fontFamily="var(--font-display)"
      >
        {initials.toUpperCase()}
      </text>
    </svg>
  );
}
