"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { RevealWaveImage } from "@/components/ui/reveal-wave-image";
import SplitText from "@/components/ui/split-text";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";

type SlideData = {
  image: string | null;
  text: string;
};

export default function Round1() {
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [buttonVisible, setButtonVisible] = useState(false);

  // Trigger delayed button appearance to let the shader load/generate
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setButtonVisible(false);
    const timer = setTimeout(() => {
      setButtonVisible(true);
    }, 1500); // 1.5s delay for cinematic pacing
    return () => clearTimeout(timer);
  }, [currentSlideIndex]);

  const slides: SlideData[] = [
    {
      image: "/final-img.jpg",
      text: "Who is the real killer??"
    }
  ];

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setDirection(1);
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      router.replace("/round2");
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setDirection(-1);
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  // Smooth slide variants for transitioning whole screen elements
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 220, damping: 26 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 220, damping: 26 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  return (
    <AuthGuard>
      <main className="w-screen h-screen overflow-hidden bg-black text-white relative flex flex-col select-none">
        
        {saveError && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm rounded-lg border border-red-500/40 bg-red-950/90 px-4 py-3 text-sm text-red-200">
            {saveError}
          </div>
        )}

        {/* Cinematic Slide Area */}
        <div className="flex-1 w-full relative">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentSlideIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full flex flex-col bg-black"
            >
              {/* Fullscreen background image with zero padding/margins */}
              <div className="absolute inset-0 w-full h-full bg-black opacity-20 z-0">
                {slides[currentSlideIndex].image ? (
                  <RevealWaveImage
                    src={slides[currentSlideIndex].image!}
                    waveSpeed={0.15}
                    waveFrequency={0.8}
                    waveAmplitude={0.4}
                    revealRadius={0.45}
                    revealSoftness={0.7}
                    pixelSize={2.0}
                    mouseRadius={0.25}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-radial-gradient flex items-center justify-center bg-zinc-950">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
                  </div>
                )}
              </div>
              {currentSlideIndex === 0 ? (
                <div 
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 md:px-12 pointer-events-auto"
                  style={{ fontFamily: "var(--font-league-gothic)" }}
                >
                  <SplitText
                    text={slides[currentSlideIndex].text}
                    tag="h1"
                    className="text-5xl sm:text-7xl md:text-8xl lg:text-7xl font-normal uppercase tracking-wider text-zinc-100 max-w-5xl leading-tight"
                    splitType="words"
                    delay={150}
                    duration={2.5}
                    ease="power2.out"
                    from={{ opacity: 0, y: 20 }}
                    to={{ opacity: 1, y: 0 }}
                    animateOnMount={true}
                  />
                </div>
              ) : (
                <>
                  {/* Bottom Vignette Overlay - Shorter */}
                  <div className="absolute bottom-0 left-0 right-0 h-[26vh] bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none z-10" />

                  {/* Text Layer over Vignette (Lower bottom placement) */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-[20vh] z-20 px-8 pb-8 flex flex-col items-center justify-center text-center pointer-events-auto"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    <SplitText
                      text={slides[currentSlideIndex].text}
                      tag="p"
                      className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-wide text-zinc-200 max-w-5xl"
                      splitType="words"
                      delay={150}
                      duration={2.5}
                      ease="power2.out"
                      from={{ opacity: 0, y: 15 }}
                      to={{ opacity: 1, y: 0 }}
                      animateOnMount={true}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center z-40">
          <div>
            {currentSlideIndex > 0 && !isSaving && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 text-zinc-500 hover:text-white transition uppercase text-xs tracking-widest font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
