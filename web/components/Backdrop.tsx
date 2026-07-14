"use client";

import dynamic from "next/dynamic";

// WebGL can't render on the server; load the shader client-side only.
const Lightfall = dynamic(() => import("./Lightfall"), { ssr: false });

/**
 * Full-viewport animated shader background, fixed behind all content.
 * Colors drive the whole product's theme: ice-blue / violet / pink over a
 * deep-blue glow.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-void">
      <Lightfall
        colors={["#A6C8FF", "#5227FF", "#FF9FFC"]}
        backgroundColor="#0A29FF"
        speed={0.5}
        streakCount={2}
        streakWidth={1}
        streakLength={1}
        glow={1}
        density={0.6}
        twinkle={1}
        zoom={3}
        backgroundGlow={0.5}
        opacity={1}
        mouseInteraction
        mouseStrength={0.5}
        mouseRadius={1}
      />
      {/* Subtle darkening so foreground text stays legible over bright streaks */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/40 via-transparent to-void/70" />
    </div>
  );
}
