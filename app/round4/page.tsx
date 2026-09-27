"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { saveGameProgress } from "@/lib/progress";

type Clue = {
  id: number;
  name: string;
};

type Suspect = {
  id: number;
  name: string;
  role: string;
  image: string;
};

export default function Round4() {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const [foundClues, setFoundClues] = useState<Clue[]>([]);
  const [accusedSuspects, setAccusedSuspects] = useState<Suspect[]>([]);

  useEffect(() => {
    // Save progress as Round 4 on mount
    saveGameProgress("round4");

    // Load discovered clues and accused suspects from localStorage
    const storedClues = localStorage.getItem("found_clues");
    const storedSuspects = localStorage.getItem("selected_suspects");

    if (storedClues) {
      try {
        setFoundClues(JSON.parse(storedClues));
      } catch (error) {
        console.error("Failed to parse stored clues:", error);
      }
    }

    if (storedSuspects) {
      try {
        setAccusedSuspects(JSON.parse(storedSuspects));
      } catch (error) {
        console.error("Failed to parse accused suspects:", error);
      }
    }
  }, []);

  const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedAnswer = answer.trim();

    if (!trimmedAnswer) {
      setIsShaking(true);
      setShowAlert(true);
      setMessage("Please write your report before submitting.");
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsSaving(true);
    setShowAlert(false);
    setMessage("");

    try {
      const user = await getCurrentUser();

      if (!user) {
        router.replace("/");
        return;
      }

      // Update round3_answer in Supabase users table (keeping column compatibility)
      const { error } = await supabase
        .from("users")
        .update({
          round3_answer: trimmedAnswer,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      router.replace("/results");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your Round 4 report.",
      );
      setShowAlert(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen w-screen bg-black text-white overflow-hidden select-none">
        
        {/* Sidebar displaying clues & accused suspects */}
        <aside className="w-80 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col p-6 overflow-y-auto">
          <h2 
            className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2 text-zinc-100 border-b border-zinc-800 pb-3"
            style={{ fontFamily: "var(--font-league-gothic)" }}
          >
            <span className="h-2 w-2 rounded-full bg-[#d01f5b] animate-pulse" />
            Case Dossier
          </h2>

          {/* Section 1: Primary Accused */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono">
              Primary Accused
            </h3>
            {accusedSuspects.length === 0 ? (
              <p className="text-xs text-zinc-600 italic font-sans">No suspects accused.</p>
            ) : (
              <div className="space-y-3">
                {accusedSuspects.map((suspect) => (
                  <div key={suspect.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="w-9 h-12 rounded overflow-hidden bg-black border border-zinc-800 flex-shrink-0">
                      <img src={suspect.image} className="w-full h-full object-cover grayscale mix-blend-screen" alt="" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-200 text-xs" style={{ fontFamily: "var(--font-montserrat)" }}>
                        {suspect.name}
                      </h4>
                      <p className="text-[9px] text-[#d01f5b] font-mono uppercase tracking-wider mt-0.5">
                        {suspect.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Evidence */}
          <div>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono">
              Evidence Folder
            </h3>
            {foundClues.length === 0 ? (
              <p className="text-xs text-zinc-600 italic font-sans">No clues found.</p>
            ) : (
              <div className="space-y-2">
                {foundClues.map((clue) => (
                  <div key={clue.id} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <div className="font-medium text-zinc-300 text-xs" style={{ fontFamily: "var(--font-montserrat)" }}>
                      {clue.name}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">
                      Evidence #{clue.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main report section */}
        <main className="flex-1 h-full flex items-center justify-center bg-black px-6 text-white overflow-y-auto">
          <section className="w-full max-w-2xl py-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#d01f5b] font-mono">
              Round 3
            </p>
            <h1
              className="mb-4 text-6xl leading-none"
              style={{ fontFamily: "var(--font-league-gothic)" }}
            >
              Final Report
            </h1>
            <p className="mb-8 text-zinc-400 font-light">
              Review your accused suspects and discovered evidence in the dossier. Write one paragraph explaining your final conclusion of the investigation.
            </p>

            {/* Floating Animated Alert */}
            <AnimatePresence>
              {showAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 24, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="fixed top-0 left-1/2 -translate-x-1/2 z-[300] max-w-md w-full px-4"
                >
                  <div className="flex items-start gap-4 rounded-2xl border border-red-500/40 bg-red-950/90 p-4 backdrop-blur-md shadow-2xl">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono">
                        Report Incomplete
                      </p>
                      <h4 className="text-sm font-semibold text-white mt-0.5">
                        Missing Analysis
                      </h4>
                      <p className="text-xs text-red-200 mt-1 leading-relaxed font-sans">
                        {message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAlert(false)}
                      className="text-red-400 hover:text-white transition p-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submitAnswer}>
              <label className="mb-2 block text-sm font-medium text-zinc-200">
                Investigation Paragraph
              </label>
              <motion.div
                animate={isShaking ? { x: [0, -10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                <textarea
                  value={answer}
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    if (event.target.value.trim() && showAlert) {
                      setShowAlert(false);
                    }
                  }}
                  rows={9}
                  className={`mb-5 w-full resize-none rounded-xl border ${
                    isShaking ? "border-red-500 shadow-lg shadow-red-500/20" : "border-zinc-700 focus:border-white"
                  } bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 font-sans text-sm leading-relaxed`}
                  placeholder="Write your analysis here..."
                  disabled={isSaving}
                />
              </motion.div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-500 cursor-pointer"
              >
                {isSaving ? "Submitting..." : "Submit Final Report"}
              </button>
            </form>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
