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
import { saveGameProgress } from "@/lib/progress";

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

  // Save progress as Round 1 on mount
  useEffect(() => {
    saveGameProgress("round1");
  }, []);

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
      image: null,
      text: "Chimera Labs was the most advanced AI research facility ever built"
    },
    {
      image: "/Scenes/Scene1.png",
      text: "Chimera Labs stands alone under a violent storm"
    },
    {
      image: "/Scenes/Scene2.png",
      text: "Project Chimera the most powerful AI system ever created"
    },
    {
      image: "/Scenes/Scene3.png",
      text: "A presence appears where no one should be"
    },
    {
      image: "/Scenes/Scene4.png",
      text: "Arjun Mehta is found dead inside the core lab"
    },
    {
      image: "/Scenes/Scene5.png",
      text: "Police arrive at Chimera Labs in heavy rain"
    },
    {
      image: "/Scenes/Scene6.png",
      text: "The entire facility is sealed as a crime scene"
    },
    {
      image: "/Scenes/Scene7.png",
      text: "A detective arrives to uncover what really happened"
    },
    {
      image: "/round1.jpg",
      text: "You have to find the clues from the scene. Good Luck!!"
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
              <div className="absolute inset-0 w-full h-full bg-black z-0">
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
                  // Step 0 Intro screen: dark background with deep radial shadow
                  <div className="w-full h-full bg-radial-gradient flex items-center justify-center bg-zinc-950">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
                  </div>
                )}
              </div>

              {/* Slide 0 Intro is centered and large; Slides 1-7 are positioned at the bottom */}
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

        {/* Minimal Control Actions */}
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

          <AnimatePresence>
            {buttonVisible && (
              <motion.button
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold tracking-widest uppercase transition hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-700 flex items-center gap-1 cursor-pointer shadow-lg"
              >
                {isSaving ? (
                  "Loading..."
                ) : currentSlideIndex === slides.length - 1 ? (
                  <>
                    Enter Lab <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </main>
    </AuthGuard>
  );
}
