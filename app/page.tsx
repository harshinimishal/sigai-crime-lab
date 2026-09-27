"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white select-none">
      {/* Fullscreen Video Background */}
      <video
        src="/videos/Loading-screen.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setIsLoading(false)}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Controls & Venue - Fades in over the last frame of the video */}
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="absolute inset-0 z-10"
          >
            {/* PLAY & LOGIN CONTROLS */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <button
                onClick={() => router.push("/signup")}
                className="
                  px-10
                  py-4
                  rounded-full
                  bg-[#d01f5b]
                  text-white
                  font-bold
                  text-2xl
                  tracking-wide
                  transition-all
                  hover:scale-105
                  shadow-xl
                  cursor-pointer
                "
                style={{
                  fontFamily: "var(--font-montserrat)",
                }}
              >
                PLAY NOW
              </button>
              <button
                onClick={() => router.push("/login")}
                className="
                  text-[#d01f5b]
                  hover:text-white
                  font-bold
                  text-sm
                  tracking-widest
                  transition-all
                  uppercase
                  cursor-pointer
                  mt-1
                "
                style={{
                  fontFamily: "var(--font-montserrat)",
                }}
              >
                RETURNING INVESTIGATOR? LOG IN
              </button>
            </div>

            {/* DATE & VENUE */}
            <div
              className="
                absolute
                right-24
                bottom-16
                text-black
                font-bold
                space-y-0
              "
              style={{
                fontFamily: "var(--font-montserrat)",
              }}
            >
              <div className="text-[clamp(2rem,2vw,4rem)]">
                • DATE: 29 SEP 2026
              </div>
              <div className="text-[clamp(2rem,2vw,4rem)]">
                • VENUE: 307
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
