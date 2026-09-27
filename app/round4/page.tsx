"use client";

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  CheckCircle2,
  FileText,
  BrainCircuit,
  KeyRound,
  Shield,
  User,
  Check,
  Clock,
  ChevronRight,
} from "lucide-react";
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

const MOTIVE_OPTIONS = [
  {
    id: "espionage",
    title: "Corporate Espionage & Theft of AI Model Weights",
    desc: "Targeted Dr. Mehta to steal Project Chimera's core neural model weights for external commercial exploitation.",
  },
  {
    id: "ethics",
    title: "Ideological Dispute on AI Commercialization",
    desc: "Violent disagreement over immediate commercial deployment vs. strict ethical safety controls of autonomous AI.",
  },
  {
    id: "coverup",
    title: "Covering Up Internal System Sabotage",
    desc: "Eliminating Dr. Mehta after he uncovered unauthorized backdoors and tampered code repositories.",
  },
  {
    id: "rivalry",
    title: "Personal Revenge & Career Rivalry",
    desc: "Sabotaging the research lead position to seize control of Chimera Labs' flagship AI division.",
  },
];

const METHOD_OPTIONS = [
  {
    id: "voice_cloning",
    title: "Voice Deepfake & Biometric Security Override",
    desc: "Utilized synthesized voice cloning vectors of admin personnel to breach high-security biometric locks.",
  },
  {
    id: "log_wiping",
    title: "CCTV Log Deletion & Admin Clearance Forgery",
    desc: "Erased 5 minutes of master CCTV security feeds and forged digital access keys during the crime window.",
  },
  {
    id: "hardware_tamper",
    title: "Physical Environmental Controls Sabotage",
    desc: "Manipulated server hardware cooling and core lab locking mechanisms to trap the victim inside.",
  },
  {
    id: "exfiltration",
    title: "SSD Exfiltration & Data Pipeline Disruption",
    desc: "Physically extracted core storage units while introducing malicious payloads into the active server cluster.",
  },
];

const DEFAULT_EVIDENCE: Clue[] = [
  { id: 1, name: "Broken Access Card" },
  { id: 2, name: "Missing SSD" },
  { id: 3, name: "Blood-Stained Keyboard" },
  { id: 4, name: "GPU Dashboard" },
  { id: 5, name: "Voice Cloning Software" },
  { id: 6, name: "Security Camera Control" },
  { id: 7, name: "Repository Access Logs" },
  { id: 8, name: "Torn Meeting Notes" },
  { id: 9, name: "USB Drive" },
  { id: 10, name: "Whiteboard" },
  { id: 11, name: "CCTV Screenshot" },
];

const CASE_TIMELINE = [
  {
    time: "23:14",
    title: "Security Feed Blackout",
    desc: "5 minutes of master CCTV camera feeds purged from central server logs.",
    tag: "LOG TAMPERING",
  },
  {
    time: "23:22",
    title: "Biometric Voice Bypass",
    desc: "Synthetic voice vector payload accepted by Core Lab terminal security.",
    tag: "DEEPFAKE ACCESS",
  },
  {
    time: "23:35",
    title: "Core SSD Exfiltration",
    desc: "Project Chimera neural model weights storage unit physically unmounted.",
    tag: "DATA THEFT",
  },
  {
    time: "23:45",
    title: "Fatal Crime Discovered",
    desc: "Dr. Arjun Mehta found non-responsive inside sealed Core Lab.",
    tag: "CRIME SCENE",
  },
];

export default function Round4() {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const [foundClues, setFoundClues] = useState<Clue[]>([]);
  const [accusedSuspects, setAccusedSuspects] = useState<Suspect[]>([]);

  // Selection states
  const [selectedPrimaryMotive, setSelectedPrimaryMotive] = useState<string | null>(null);
  const [selectedSecondaryMotive, setSelectedSecondaryMotive] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<Clue[]>([]);

  const [activeTab, setActiveTab] = useState<"review" | "deduce" | "justify" | "submit">("review");

  useEffect(() => {
    // Save progress as Round 4 on mount
    saveGameProgress("round4");

    // Load discovered clues and accused suspects from localStorage
    const storedClues = localStorage.getItem("found_clues");
    const storedSuspects = localStorage.getItem("selected_suspects");

    if (storedClues) {
      try {
        const parsed = JSON.parse(storedClues);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFoundClues(parsed);
        }
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

  // Determine full pool of available evidence (combining found + defaults if needed)
  const availableEvidence: Clue[] = (() => {
    const combined = [...foundClues];
    DEFAULT_EVIDENCE.forEach((def) => {
      if (!combined.some((c) => c.name.toLowerCase() === def.name.toLowerCase())) {
        combined.push(def);
      }
    });
    return combined;
  })();

  const toggleEvidenceSelection = (clue: Clue) => {
    if (selectedEvidence.some((c) => c.id === clue.id || c.name === clue.name)) {
      setSelectedEvidence(selectedEvidence.filter((c) => c.id !== clue.id && c.name !== clue.name));
    } else {
      if (selectedEvidence.length < 3) {
        setSelectedEvidence([...selectedEvidence, clue]);
      } else {
        // Replace last if already 3 selected
        setSelectedEvidence([selectedEvidence[0], selectedEvidence[1], clue]);
      }
    }
  };

  const primarySuspect = accusedSuspects[0] || null;
  const secondarySuspect = accusedSuspects[1] || null;

  const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missingItems: string[] = [];
    if (!selectedPrimaryMotive) missingItems.push("Primary Suspect Motive");
    if (!selectedSecondaryMotive) missingItems.push("Secondary Suspect Motive");
    if (!selectedMethod) missingItems.push("Suspected Method");
    if (selectedEvidence.length !== 3) missingItems.push("Exactly 3 Supporting Evidence items");
    if (!answer.trim()) missingItems.push("Written Final Report");

    if (missingItems.length > 0) {
      setIsShaking(true);
      setShowAlert(true);
      setMessage(`Incomplete Report! Please provide: ${missingItems.join(", ")}.`);
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

      const primaryMotiveObj = MOTIVE_OPTIONS.find((m) => m.id === selectedPrimaryMotive);
      const secondaryMotiveObj = MOTIVE_OPTIONS.find((m) => m.id === selectedSecondaryMotive);
      const selectedMethodObj = METHOD_OPTIONS.find((m) => m.id === selectedMethod);

      // Dynamic accuracy-based Round 4 score calculation (Max 25 pts)
      let calculatedR4Score = 0;

      // 1. Primary Suspect correctness (Max 10 pts)
      if (primarySuspect?.name === "Sara Khan") {
        calculatedR4Score += 10;
      } else if (primarySuspect?.name === "Kabir Malhotra") {
        calculatedR4Score += 5;
      }

      // 2. Secondary Suspect correctness (Max 5 pts)
      if (secondarySuspect?.name === "Kabir Malhotra") {
        calculatedR4Score += 5;
      } else if (secondarySuspect?.name === "Sara Khan") {
        calculatedR4Score += 3;
      }

      // 3. Primary Motive correctness (Max 3 pts)
      if (selectedPrimaryMotive === "espionage") {
        calculatedR4Score += 3;
      }

      // 4. Secondary Motive correctness (Max 2 pts)
      if (selectedSecondaryMotive === "ethics" || selectedSecondaryMotive === "espionage") {
        calculatedR4Score += 2;
      }

      // 5. Method correctness (Max 3 pts)
      if (selectedMethod === "voice_cloning" || selectedMethod === "log_wiping") {
        calculatedR4Score += 3;
      }

      // 6. Evidence relevance (Max 2 pts)
      const keyClueNames = ["voice cloning software", "missing ssd", "broken access card", "repository access logs"];
      const relevantCount = selectedEvidence.filter((e) =>
        keyClueNames.includes(e.name.toLowerCase())
      ).length;
      if (relevantCount >= 2) {
        calculatedR4Score += 2;
      } else if (relevantCount >= 1) {
        calculatedR4Score += 1;
      }

      calculatedR4Score = Math.min(25, calculatedR4Score);

      const finalReportData = {
        primarySuspect: primarySuspect ? primarySuspect.name : "Unspecified",
        primarySuspectRole: primarySuspect ? primarySuspect.role : "",
        primaryMotive: primaryMotiveObj ? primaryMotiveObj.title : selectedPrimaryMotive,
        secondarySuspect: secondarySuspect ? secondarySuspect.name : "Unspecified",
        secondarySuspectRole: secondarySuspect ? secondarySuspect.role : "",
        secondaryMotive: secondaryMotiveObj ? secondaryMotiveObj.title : selectedSecondaryMotive,
        method: selectedMethodObj ? selectedMethodObj.title : selectedMethod,
        supportingEvidence: selectedEvidence.map((e) => e.name),
        writtenReport: answer.trim(),
        score: calculatedR4Score,
        submittedAt: new Date().toISOString(),
      };

      // Save structured payload to localStorage for client access
      localStorage.setItem("final_report", JSON.stringify(finalReportData));
      localStorage.setItem("round4_report", JSON.stringify(finalReportData));

      // Database string formatting (guaranteed column)
      const formattedReportString = `[PRIMARY: ${finalReportData.primarySuspect} (MOTIVE: ${finalReportData.primaryMotive})] [SECONDARY: ${finalReportData.secondarySuspect} (MOTIVE: ${finalReportData.secondaryMotive})] [METHOD: ${finalReportData.method}] [EVIDENCE: ${finalReportData.supportingEvidence.join(", ")}] | SCORE: ${calculatedR4Score}/25 | ANALYSIS: ${answer.trim()}`;

      // Base guaranteed update payload
      const basePayload = {
        round3_answer: formattedReportString,
      };

      // Extended update payload including all new columns
      const extendedPayload = {
        ...basePayload,
        primary_suspect: finalReportData.primarySuspect,
        primary_motive: finalReportData.primaryMotive,
        secondary_suspect: finalReportData.secondarySuspect,
        secondary_motive: finalReportData.secondaryMotive,
        round4_motive: `Primary: ${finalReportData.primaryMotive} | Secondary: ${finalReportData.secondaryMotive}`,
        round4_method: finalReportData.method,
        round4_evidence: finalReportData.supportingEvidence,
        round4_report: answer.trim(),
        round4_score: calculatedR4Score,
      };

      // First attempt: Extended update
      let { error } = await supabase
        .from("users")
        .update(extendedPayload)
        .eq("id", user.id);

      // Fallback attempt: Base update if extended schema columns do not exist in database
      if (error) {
        console.warn("Extended Supabase update failed, falling back to base round3_answer update:", error);
        const resFallback = await supabase
          .from("users")
          .update(basePayload)
          .eq("id", user.id);

        error = resFallback.error;
      }

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
        
        {/* Sidebar: Case Dossier */}
        <aside className="w-80 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col p-6 overflow-y-auto shrink-0">
          <h2 
            className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2 text-zinc-100 border-b border-zinc-800 pb-3"
            style={{ fontFamily: "var(--font-league-gothic)" }}
          >
            <span className="h-2 w-2 rounded-full bg-[#d01f5b] animate-pulse" />
            Case Dossier
          </h2>

          {/* Suspects Review */}
          <div className="mb-6">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono flex items-center justify-between">
              <span>Target Suspects</span>
              <span className="text-zinc-600 font-normal">Round 3 Selection</span>
            </h3>
            {accusedSuspects.length === 0 ? (
              <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-xs text-zinc-500 italic">
                No suspects formally accused.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Primary Suspect */}
                {primarySuspect && (
                  <div className="p-3 bg-zinc-900 border border-[#d01f5b]/40 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#d01f5b] text-white text-[8px] font-bold font-mono px-2 py-0.5 rounded-bl uppercase">
                      Primary
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded overflow-hidden bg-black border border-zinc-800 shrink-0">
                        <img src={primarySuspect.image} className="w-full h-full object-cover grayscale mix-blend-screen" alt="" />
                      </div>
                      <div className="pr-12">
                        <h4 className="font-bold text-zinc-100 text-xs" style={{ fontFamily: "var(--font-montserrat)" }}>
                          {primarySuspect.name}
                        </h4>
                        <p className="text-[9px] text-[#d01f5b] font-mono uppercase tracking-wider mt-0.5">
                          {primarySuspect.role}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secondary Suspect */}
                {secondarySuspect && (
                  <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-400 text-[8px] font-bold font-mono px-2 py-0.5 rounded-bl uppercase">
                      Secondary
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded overflow-hidden bg-black border border-zinc-800 shrink-0">
                        <img src={secondarySuspect.image} className="w-full h-full object-cover grayscale mix-blend-screen" alt="" />
                      </div>
                      <div className="pr-12">
                        <h4 className="font-semibold text-zinc-300 text-xs" style={{ fontFamily: "var(--font-montserrat)" }}>
                          {secondarySuspect.name}
                        </h4>
                        <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mt-0.5">
                          {secondarySuspect.role}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evidence List */}
          <div>
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono flex items-center justify-between">
              <span>Evidence Folder</span>
              <span className="text-[#d01f5b] font-mono">{availableEvidence.length} items</span>
            </h3>
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {availableEvidence.map((clue) => {
                const isSelected = selectedEvidence.some((c) => c.name === clue.name);
                return (
                  <div
                    key={clue.id}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      isSelected
                        ? "bg-[#d01f5b]/10 border-[#d01f5b]/60 text-white"
                        : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-200 text-xs">{clue.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#d01f5b]" />}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">
                      Evidence #{clue.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full flex flex-col bg-black overflow-y-auto relative">
          
          {/* Top Header & Step Progress Bar */}
          <div className="w-full max-w-5xl mx-auto px-8 pt-8 pb-4">
            <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d01f5b] font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d01f5b]" />
                  Round 4 — Final Phase
                </p>
                <h1
                  className="text-5xl leading-none font-bold text-white mt-1"
                  style={{ fontFamily: "var(--font-league-gothic)" }}
                >
                  Final Investigation Report
                </h1>
              </div>

              {/* Step Navigation Pill */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-full border border-zinc-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab("review")}
                  className={`px-3 py-1 rounded-full transition ${
                    activeTab === "review" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  1. Review
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("deduce")}
                  className={`px-3 py-1 rounded-full transition ${
                    activeTab === "deduce" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  2. Deduce
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("justify")}
                  className={`px-3 py-1 rounded-full transition ${
                    activeTab === "justify" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  3. Justify
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("submit")}
                  className={`px-3 py-1 rounded-full transition ${
                    activeTab === "submit" ? "bg-white text-black font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  4. Submit
                </button>
              </div>
            </div>
          </div>

          {/* Floating Warning Banner */}
          <AnimatePresence>
            {showAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] max-w-lg w-full px-4"
              >
                <div className="flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-950/90 p-4 backdrop-blur-md shadow-2xl">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-mono">
                      Report Incomplete
                    </p>
                    <p className="text-xs text-red-100 mt-0.5">{message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAlert(false)}
                    className="text-red-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Sections Container */}
          <div className="w-full max-w-5xl mx-auto px-8 py-6 space-y-10 flex-1 pb-16">

            {/* SECTION 1: CASE RECONSTRUCTION */}
            {(activeTab === "review" || activeTab === "submit") && (
              <section className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#d01f5b]" />
                    <h2 
                      className="text-2xl font-bold uppercase tracking-wide text-zinc-100"
                      style={{ fontFamily: "var(--font-league-gothic)" }}
                    >
                      Case Reconstruction & Key Timeline
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest">
                    Chimera Labs Incident Log
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CASE_TIMELINE.map((evt, index) => (
                    <div key={index} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-[#d01f5b] bg-[#d01f5b]/10 px-2 py-0.5 rounded border border-[#d01f5b]/20">
                            {evt.time}
                          </span>
                          <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-500">
                            {evt.tag}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-200" style={{ fontFamily: "var(--font-montserrat)" }}>
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed font-sans font-light">
                          {evt.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: MOTIVE & METHOD SELECTION */}
            {(activeTab === "deduce" || activeTab === "submit") && (
              <section className="space-y-6">
                {/* 1. Primary Suspect Motive Selection */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-[#d01f5b]" />
                      <h2 
                        className="text-2xl font-bold uppercase tracking-wide text-zinc-100"
                        style={{ fontFamily: "var(--font-league-gothic)" }}
                      >
                        1. Primary Suspect Motive <span className="text-[#d01f5b] text-base font-sans">*</span>
                      </h2>
                    </div>
                    {primarySuspect && (
                      <span className="text-xs font-mono text-[#d01f5b] bg-[#d01f5b]/10 border border-[#d01f5b]/20 px-3 py-1 rounded-full">
                        Target: {primarySuspect.name} ({primarySuspect.role})
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOTIVE_OPTIONS.map((motive) => {
                      const isSelected = selectedPrimaryMotive === motive.id;
                      return (
                        <div
                          key={`primary-${motive.id}`}
                          onClick={() => setSelectedPrimaryMotive(motive.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? "bg-[#d01f5b]/10 border-[#d01f5b] shadow-lg shadow-[#d01f5b]/5 text-white"
                              : "bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-[#d01f5b] bg-[#d01f5b]" : "border-zinc-700 bg-zinc-900"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold tracking-wide" style={{ fontFamily: "var(--font-montserrat)" }}>
                              {motive.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed font-sans font-light">
                              {motive.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Secondary Suspect Motive Selection */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-amber-500" />
                      <h2 
                        className="text-2xl font-bold uppercase tracking-wide text-zinc-100"
                        style={{ fontFamily: "var(--font-league-gothic)" }}
                      >
                        2. Secondary Suspect Motive <span className="text-[#d01f5b] text-base font-sans">*</span>
                      </h2>
                    </div>
                    {secondarySuspect && (
                      <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-full">
                        Target: {secondarySuspect.name} ({secondarySuspect.role})
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOTIVE_OPTIONS.map((motive) => {
                      const isSelected = selectedSecondaryMotive === motive.id;
                      return (
                        <div
                          key={`secondary-${motive.id}`}
                          onClick={() => setSelectedSecondaryMotive(motive.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5 text-white"
                              : "bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-amber-500 bg-amber-500" : "border-zinc-700 bg-zinc-900"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold tracking-wide" style={{ fontFamily: "var(--font-montserrat)" }}>
                              {motive.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed font-sans font-light">
                              {motive.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Method Selection */}
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
                    <KeyRound className="w-5 h-5 text-[#d01f5b]" />
                    <h2 
                      className="text-2xl font-bold uppercase tracking-wide text-zinc-100"
                      style={{ fontFamily: "var(--font-league-gothic)" }}
                    >
                      3. Select Suspected Execution Method <span className="text-[#d01f5b] text-base font-sans">*</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {METHOD_OPTIONS.map((method) => {
                      const isSelected = selectedMethod === method.id;
                      return (
                        <div
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? "bg-[#d01f5b]/10 border-[#d01f5b] shadow-lg shadow-[#d01f5b]/5 text-white"
                              : "bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-[#d01f5b] bg-[#d01f5b]" : "border-zinc-900"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold tracking-wide" style={{ fontFamily: "var(--font-montserrat)" }}>
                              {method.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed font-sans font-light">
                              {method.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 3: SUPPORTING EVIDENCE SELECTION */}
            {(activeTab === "justify" || activeTab === "submit") && (
              <section className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#d01f5b]" />
                    <h2 
                      className="text-2xl font-bold uppercase tracking-wide text-zinc-100"
                      style={{ fontFamily: "var(--font-league-gothic)" }}
                    >
                      4. Select 3 Strongest Pieces of Supporting Evidence <span className="text-[#d01f5b] text-base font-sans">*</span>
                    </h2>
                  </div>
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    selectedEvidence.length === 3
                      ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800"
                  }`}>
                    Selected: {selectedEvidence.length}/3
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mb-4 font-sans font-light">
                  Choose the 3 key evidence items from your dossier that most strongly prove your Primary Suspect&apos;s involvement:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableEvidence.map((clue) => {
                    const isSelected = selectedEvidence.some((c) => c.name === clue.name);
                    return (
                      <div
                        key={clue.id}
                        onClick={() => toggleEvidenceSelection(clue)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? "bg-[#d01f5b]/15 border-[#d01f5b] text-white shadow"
                            : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-xs" style={{ fontFamily: "var(--font-montserrat)" }}>
                            {clue.name}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">
                            Evidence #{clue.id}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-[#d01f5b] border-[#d01f5b]" : "border-zinc-700 bg-zinc-950"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION 4: WRITTEN REPORT & FINAL SUMMARY */}
            {(activeTab === "justify" || activeTab === "submit") && (
              <section className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 border-b border-zinc-900 pb-3">
                    <Shield className="w-5 h-5 text-[#d01f5b]" />
                    <h2 
                      className="text-2xl font-bold uppercase tracking-wide text-zinc-100"
                      style={{ fontFamily: "var(--font-league-gothic)" }}
                    >
                      5. Written Investigation Report <span className="text-[#d01f5b] text-base font-sans">*</span>
                    </h2>
                  </div>
                  
                  <p className="text-xs text-zinc-300 font-medium mb-3">
                    Explain who you believe is responsible, why, how the crime was carried out, and which evidence supports your conclusion.
                  </p>

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
                      rows={6}
                      className={`w-full resize-none rounded-xl border ${
                        isShaking ? "border-red-500 shadow-lg shadow-red-500/20" : "border-zinc-800 focus:border-white"
                      } bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 font-sans text-xs leading-relaxed`}
                      placeholder="Detail your deductions here..."
                      disabled={isSaving}
                    />
                  </motion.div>
                </div>

                {/* Final Case Summary Card */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-800 pb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d01f5b]" />
                    Final Case Summary Preview
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                      <span className="text-zinc-500 text-[10px] font-mono uppercase block">Primary Accused:</span>
                      <span className="font-semibold text-white block mt-0.5">
                        {primarySuspect ? `${primarySuspect.name} (${primarySuspect.role})` : "None Selected"}
                      </span>
                      <span className="text-zinc-500 text-[10px] font-mono uppercase block mt-2">Primary Motive:</span>
                      <span className="text-zinc-300 block mt-0.5">
                        {selectedPrimaryMotive
                          ? MOTIVE_OPTIONS.find((m) => m.id === selectedPrimaryMotive)?.title
                          : "Not Selected"}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                      <span className="text-zinc-500 text-[10px] font-mono uppercase block">Secondary Accused:</span>
                      <span className="font-semibold text-zinc-300 block mt-0.5">
                        {secondarySuspect ? `${secondarySuspect.name} (${secondarySuspect.role})` : "None Selected"}
                      </span>
                      <span className="text-zinc-500 text-[10px] font-mono uppercase block mt-2">Secondary Motive:</span>
                      <span className="text-zinc-300 block mt-0.5">
                        {selectedSecondaryMotive
                          ? MOTIVE_OPTIONS.find((m) => m.id === selectedSecondaryMotive)?.title
                          : "Not Selected"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-xs font-sans">
                    <span className="text-zinc-500 text-[10px] font-mono uppercase block">Suspected Execution Method:</span>
                    <span className="text-zinc-200 block mt-0.5">
                      {selectedMethod
                        ? METHOD_OPTIONS.find((m) => m.id === selectedMethod)?.title
                        : "Not Selected"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 text-[10px] font-mono uppercase block mb-1.5">Supporting Evidence (3 Required):</span>
                    {selectedEvidence.length === 0 ? (
                      <span className="text-xs text-zinc-600 italic">None selected</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedEvidence.map((e) => (
                          <span key={e.id} className="text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded-md font-mono">
                            {e.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Submit Button */}
                <form onSubmit={submitAnswer}>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-xl bg-white px-4 py-3.5 font-bold text-black uppercase tracking-wider text-xs transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-600 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isSaving ? (
                      "Saving Final Report..."
                    ) : (
                      <>
                        Submit Final Investigation Report <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}

            {/* Stepper Navigation Footer Button when on earlier tabs */}
            {activeTab !== "submit" && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "review") setActiveTab("deduce");
                    else if (activeTab === "deduce") setActiveTab("justify");
                    else if (activeTab === "justify") setActiveTab("submit");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-zinc-100 text-black text-xs font-bold tracking-wider uppercase hover:bg-white transition flex items-center gap-2 cursor-pointer shadow"
                >
                  Proceed to Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

