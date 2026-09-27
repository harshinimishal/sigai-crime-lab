"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { saveGameProgress } from "@/lib/progress";

type Clue = {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function Round2() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [foundClues, setFoundClues] = useState<Clue[]>([]);
  const [clicksLeft, setClicksLeft] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [scale, setScale] = useState(1);
  const router = useRouter();

  // Save progress as Round 2 on mount
  useEffect(() => {
    saveGameProgress("round2");
  }, []);

  // Dynamically calculate scale to fit 1490x945 image within the viewport
  useEffect(() => {
    function handleResize() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const targetWidth = 1490;
      const targetHeight = 945;

      const scaleX = windowWidth / targetWidth;
      const scaleY = windowHeight / targetHeight;

      // Fit the image completely inside the window, preserving aspect ratio
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const clues: Clue[] = [
    {
      id: 1,
      name: "Broken Access Card",
      x: 220,
      y: 230,
      width: 75,
      height: 50,
    },
    {
      id: 2,
      name: "Missing SSD",
      x: 450,
      y: 430,
      width: 75,
      height: 60,
    },
    {
      id: 3,
      name: "Blood-Stained Keyboard",
      x: 650,
      y: 400,
      width: 150,
      height: 100,
    },
    {
      id: 4,
      name: "GPU Dashboard",
      x: 560,
      y: 300,
      width: 170,
      height: 80,
    },
    {
      id: 5,
      name: "Voice Cloning Software",
      x: 740,
      y: 300,
      width: 170,
      height: 80,
    },
    {
      id: 6,
      name: "Security camera control",
      x: 40,
      y: 350,
      width: 70,
      height: 150,
    },
    {
      id: 7,
      name: "Repository access logs",
      x: 940,
      y: 400,
      width: 120,
      height: 80,
    },
    {
      id: 8,
      name: "Torn Meeting Notes",
      x: 850,
      y: 580,
      width: 70,
      height: 90,
    },
    {
      id: 9,
      name: "USB Drive",
      x: 585,
      y: 545,
      width: 30,
      height: 30,
    },
    {
      id: 10,
      name: "Whiteboard",
      x: 1000,
      y: 20,
      width: 350,
      height: 160,
    },
    {
      id: 11,
      name: "Envelope",
      x: 40,
      y: 560,
      width: 120,
      height: 80,
    },
    {
      id: 12,
      name: "Smartphone",
      x: 600,
      y: 690,
      width: 50,
      height: 80,
    },
    {
      id: 13,
      name: "CCTV Screenshot",
      x: 950,
      y: 690,
      width: 150,
      height: 90,
    },
    {
      id: 14,
      name: "Crumbled Sticky note",
      x: 830,
      y: 700,
      width: 40,
      height: 40,
    },
    {
      id: 15,
      name: "Damaged Hard drive",
      x: 230,
      y: 750,
      width: 40,
      height: 40,
    },
  ];

  const discoverClue = (clue: Clue) => {
    if (clicksLeft <= 0) return;

    setClicksLeft((prev) => prev - 1);
    setIsSidebarOpen(true);

    if (!foundClues.some((c) => c.id === clue.id)) {
      setFoundClues((prev) => [...prev, clue]);
    }
  };

  const handleSceneClick = () => {
    if (clicksLeft <= 0) return;
    setClicksLeft((prev) => prev - 1);
  };

  const finishRound = async () => {
    setIsSaving(true);
    setSaveError("");

    try {
      const user = await getCurrentUser();

      if (!user) {
        router.replace("/");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          round1_score: foundClues.length,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      // Store clues in localStorage to display on the sidebar in Round 3
      localStorage.setItem("found_clues", JSON.stringify(foundClues));

      router.replace("/round3");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your Round 2 score.";

      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
        {/* Floating clicks counter */}
        <div
          className="
            fixed
            top-4
            left-4
            z-[100]
            bg-black
            text-white
            px-4
            py-2
            rounded-lg
            border
            border-zinc-700
            font-semibold
          "
        >
          Clicks Left: {clicksLeft}/30
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={finishRound}
          disabled={isSaving}
          className="
            fixed
            top-4
            left-48
            z-[100]
            bg-white
            text-black
            px-4
            py-2
            rounded-lg
            font-semibold
            disabled:cursor-not-allowed
            disabled:bg-zinc-500
          "
        >
          {isSaving ? "Saving..." : "Finish Round 1"}
        </button>

        {saveError && (
          <div className="fixed left-4 top-16 z-[100] max-w-sm rounded-lg border border-red-500/40 bg-red-950/90 px-4 py-3 text-sm text-red-100">
            {saveError}
          </div>
        )}

        {/* Scaling game board wrapper */}
        <div
          className="relative flex-shrink-0 select-none bg-black"
          style={{
            width: "1490px",
            height: "945px",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* Main scene image (16:9 ratio centered vertically with 53.5px top/bottom padding) */}
          <div 
            onClick={handleSceneClick} 
            className="absolute left-0 top-[53.5px] w-[1490px] h-[838px] cursor-crosshair"
          >
            <Image
              src="/round1.jpg"
              alt="Crime Scene"
              width={1490}
              height={838}
              className="w-[1490px] h-[838px] select-none pointer-events-none"
              priority
            />
          </div>

          {/* Clue button markers (shifted down by 53.5px to align with centered image content) */}
          {clues.map((clue) => {
            const discovered = foundClues.some((c) => c.id === clue.id);
            if (discovered) return null;

            return (
              <motion.button
                key={clue.id}
                layoutId={`clue-${clue.id}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent trigger parent handleSceneClick
                  if (clicksLeft > 0) {
                    discoverClue(clue);
                  }
                }}
                className="
                  absolute
                  bg-transparent
                  border-none
                  cursor-crosshair
                  select-none
                "
                style={{
                  left: clue.x,
                  top: clue.y + 53.5,
                  width: clue.width,
                  height: clue.height,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
              />
            );
          })}
        </div>

        {/* Evidence Sidebar */}
        <motion.div
          initial={false}
          animate={{
            x: isSidebarOpen ? 0 : 320,
          }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 25,
          }}
          className="
            fixed
            top-0
            right-0
            h-screen
            w-80
            bg-black
            text-white
            shadow-2xl
            z-50
            overflow-y-auto
          "
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Evidence</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {foundClues.length === 0 ? (
              <p className="text-zinc-500">Click clues on the scene.</p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {foundClues.map((clue) => (
                    <motion.div
                      key={clue.id}
                      layoutId={`clue-${clue.id}`}
                      className="
                        rounded-lg
                        bg-zinc-900
                        border
                        border-zinc-700
                        overflow-hidden
                      "
                    >
                      <div className="p-4">
                        <div className="font-semibold">{clue.name}</div>
                        <div className="text-xs text-zinc-400 mt-1">
                          Evidence #{clue.id}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* Hover area to reopen sidebar */}
        {!isSidebarOpen && (
          <div
            onMouseEnter={() => setIsSidebarOpen(true)}
            className="
              fixed
              top-0
              right-0
              h-screen
              w-4
              z-40
            "
          />
        )}

        {/* Round completed modal */}
        {clicksLeft === 0 && (
          <div
            className="
              fixed
              inset-0
              bg-black/80
              flex
              items-center
              justify-center
              z-[200]
            "
          >
            <div
              className="
                bg-zinc-900
                border
                border-zinc-700
                rounded-xl
                p-8
                text-center
                text-white
              "
            >
              <h2 className="text-3xl font-bold mb-4">Round Complete</h2>
              <p className="text-zinc-400 mb-6">You have used all 30 clicks.</p>
              <button
                onClick={finishRound}
                disabled={isSaving}
                className="
                  px-6
                  py-3
                  bg-[#d01f5b]
                  hover:bg-[#b01648]
                  rounded-lg
                  font-semibold
                  disabled:cursor-not-allowed
                  disabled:bg-zinc-600
                "
              >
                {isSaving ? "Saving Score..." : "Move To Round 2"}
              </button>
              {saveError && (
                <p className="mt-4 text-sm text-red-300">{saveError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
