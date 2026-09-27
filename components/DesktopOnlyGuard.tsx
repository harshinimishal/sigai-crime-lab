"use client";

import { Laptop, AlertTriangle } from "lucide-react";

export function DesktopOnlyGuard() {
  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        flex-col
        items-center
        justify-center
        bg-black
        px-6
        text-center
        lg:hidden
        select-none
      "
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-gradient opacity-30 pointer-events-none" />

      {/* Warning Box */}
      <div
        className="
          relative
          max-w-md
          w-full
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-900/60
          p-8
          backdrop-blur-xl
          shadow-2xl
          flex
          flex-col
          items-center
        "
      >
        {/* Animated Icon Container */}
        <div
          className="
            mb-6
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-full
            bg-[#d01f5b]/10
            border
            border-[#d01f5b]/30
            text-[#d01f5b]
            relative
          "
        >
          <Laptop className="h-8 w-8" />
          <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 border border-black animate-bounce">
            <AlertTriangle className="h-3 w-3" />
          </div>
        </div>

        {/* Header Title */}
        <p className="text-[10px] font-bold text-[#d01f5b] uppercase tracking-[0.25em] font-mono mb-2">
          Investigator System
        </p>
        <h2
          className="text-4xl font-normal uppercase tracking-wider text-white mb-4 leading-none"
          style={{ fontFamily: "var(--font-league-gothic)" }}
        >
          Desktop Required
        </h2>

        {/* Message */}
        <p
          className="text-sm text-zinc-400 leading-relaxed mb-2"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          The Crime Lab forensic workstation is optimized for high-resolution desktop and laptop screens to display evidence, timelines, and suspect profiles.
        </p>
        
        <p
          className="text-xs text-zinc-500 italic"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          Please switch to a computer or expand your browser window to proceed.
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-[9px] text-zinc-600 font-mono tracking-widest uppercase">
        SIGAI Crime Lab Security Protocol
      </div>
    </div>
  );
}
