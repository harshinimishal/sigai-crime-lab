"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Eye, Shield, User, FileText, ChevronRight } from "lucide-react";
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
  bio: string;
  icon: React.ReactNode;
  gradient: string;
};

export default function Round3() {
  const router = useRouter();
  const [foundClues, setFoundClues] = useState<Clue[]>([]);
  const [selectedSuspects, setSelectedSuspects] = useState<Suspect[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Save progress as Round 3 on mount
    saveGameProgress("round3");

    // Load clicked clues stored in localStorage from Round 2
    const stored = localStorage.getItem("found_clues");
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFoundClues(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse stored clues:", error);
      }
    }
  }, []);

  const suspects: Suspect[] = [
    {
      id: 1,
      name: "Nisha Rao",
      role: "Intern",
      image: "/Suspects/nisha-rao.png",
      gradient: "from-red-600/20 to-zinc-950",
      icon: <User className="w-8 h-8 text-blue-400" />,
      bio: "Nisha Rao is a junior intern at Chimera Labs. Suspected of gaining unauthorized access to the core laboratory during late hours under the pretext of cleaning up code repositories. Claims she was just finishing her daily tasks."
    },
    {
      id: 2,
      name: "Vikram Shah",
      role: "Cybersecurity Analyst",
      image: "/Suspects/vikram-shah.png",
      gradient: "from-red-600/20 to-zinc-950",
      icon: <Shield className="w-8 h-8 text-red-400" />,
      bio: "Vikram Shah is the Lead Cybersecurity Analyst. Has access to all security logs and administrative systems. An inspection revealed that 5 minutes of security logs were deleted around the time Arjun Mehta died."
    },
    {
      id: 3,
      name: "Riya Kapoor",
      role: "Junior AI Engineer",
      image: "/Suspects/riya-kapoor.png",
      gradient: "from-red-600/20 to-zinc-950",
      icon: <User className="w-8 h-8 text-amber-400" />,
      bio: "Riya Kapoor is a Junior AI Research Engineer. Had disagreements with Arjun Mehta regarding Project Chimera's ethical boundaries. She wanted the system to be commercialized immediately."
    },
    {
      id: 4,
      name: "Kabir Malhotra",
      role: "Lead Deepfake Engineer",
      image: "/Suspects/kabir.png",
      gradient: "from-red-600/20 to-zinc-950",
      icon: <Eye className="w-8 h-8 text-emerald-400" />,
      bio: "Kabir Malhotra is the Lead Deepfake & Voice Cloning Engineer. Specialized in synthesizing voice blueprints. Suspected of creating the deepfakes utilized to bypass security authentication inside the facility."
    },
    {
      id: 5,
      name: "Sara Khan",
      role: "Operations Manager",
      image: "/Suspects/sara-khan.png",
      gradient: "from-red-600/20 to-zinc-950",
      icon: <Shield className="w-8 h-8 text-purple-400" />,
      bio: "Sara Khan is the Operations Manager. Controls facility scheduling and staff rosters. Secretly colluded with external parties to acquire Project Chimera's source code."
    }
  ];

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, suspect: Suspect) => {
    e.dataTransfer.setData("suspectId", suspect.id.toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const suspectId = e.dataTransfer.getData("suspectId");
    if (suspectId) {
      const suspect = suspects.find((s) => s.id === parseInt(suspectId));
      if (suspect) {
        addSuspectToSelection(suspect);
      }
    }
  };

  const addSuspectToSelection = (suspect: Suspect) => {
    if (selectedSuspects.some((s) => s.id === suspect.id)) {
      return; // Already selected
    }
    if (selectedSuspects.length >= 2) {
      // Overwrite the last one if already 2 selected
      setSelectedSuspects([selectedSuspects[0], suspect]);
    } else {
      setSelectedSuspects([...selectedSuspects, suspect]);
    }
  };

  const removeSuspectFromSelection = (index: number) => {
    setSelectedSuspects(selectedSuspects.filter((_, i) => i !== index));
  };

  const handleSelectClick = (suspect: Suspect) => {
    if (selectedSuspects.some((s) => s.id === suspect.id)) {
      setSelectedSuspects(selectedSuspects.filter((s) => s.id !== suspect.id));
    } else {
      addSuspectToSelection(suspect);
    }
  };

  const handleFinish = async () => {
    if (selectedSuspects.length !== 2) {
      setMessage("Please accuse exactly 2 suspects to proceed.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/");
        return;
      }

      let selectionScore = 0;
      const hasSara = selectedSuspects.some((s) => s.name === "Sara Khan");
      const hasKabir = selectedSuspects.some((s) => s.name === "Kabir Malhotra");

      if (hasSara) {
        selectionScore = 20;
      } else if (hasKabir) {
        selectionScore = 10;
      } else {
        selectionScore = 0;
      }

      // Update database round2_score
      const { error } = await supabase
        .from("users")
        .update({
          round2_score: selectionScore,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      // Store selected suspects in localStorage for Round 4 Report review
      // We map to avoid serializing the circular React 'icon' nodes
      const serializedSuspects = selectedSuspects.map(({ id, name, role, image }) => ({
        id,
        name,
        role,
        image
      }));
      localStorage.setItem("selected_suspects", JSON.stringify(serializedSuspects));

      router.replace("/round4");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save suspect selection.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen w-screen bg-black text-white overflow-hidden select-none">
        
        {/* Sidebar displaying Round 2 clues */}
        <aside className="w-80 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col p-6 overflow-y-auto">
          <h2 
            className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2 text-zinc-100 border-b border-zinc-800 pb-3"
            style={{ fontFamily: "var(--font-league-gothic)" }}
          >
            <span className="h-2 w-2 rounded-full bg-[#d01f5b] animate-pulse" />
            Evidence Folder
          </h2>
          
          {foundClues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-600">
              <FileText className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm italic font-sans">No clues recovered from the crime scene.</p>
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {foundClues.map((clue) => (
                <div 
                  key={clue.id} 
                  className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition"
                >
                  <div 
                    className="font-semibold text-zinc-200 text-sm"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {clue.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-1.5 uppercase tracking-wider">
                    Evidence Case #{clue.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main Suspect Portraits Area */}
        <section className="flex-1 h-full flex flex-col p-8 relative overflow-y-auto bg-black justify-between">
          
          {/* Header */}
          <div className="w-full max-w-6xl mx-auto flex justify-between items-center border-b border-zinc-800 pb-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#d01f5b] font-mono">
                Round 2
              </p>
              <h1 
                className="text-5xl leading-none font-bold text-white mt-1"
                style={{ fontFamily: "var(--font-league-gothic)" }}
              >
                Suspect Profiles
              </h1>
            </div>
            
            <button
              onClick={handleFinish}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold tracking-widest uppercase transition hover:bg-zinc-200 active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Go To Final Report"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {message && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-sm rounded-lg border border-red-500/40 bg-red-950/90 px-4 py-3 text-sm text-red-200 text-center">
              {message}
            </div>
          )}

          {/* Grid of 5 Suspects (Full Height Cards h-[50vh]) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl w-full mx-auto my-auto py-6 items-stretch">
            {suspects.map((suspect) => {
              const isSelected = selectedSuspects.some((s) => s.id === suspect.id);
              return (
                <div 
                  key={suspect.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, suspect)}
                  onClick={() => handleSelectClick(suspect)}
                  className={`relative overflow-hidden rounded-xl border ${
                    isSelected ? "border-[#d01f5b] shadow-lg shadow-[#d01f5b]/10" : "border-zinc-800"
                  } bg-zinc-900 h-[50vh] group cursor-grab active:cursor-grabbing shadow-xl flex flex-col justify-end transition`}
                >
                  {/* Select Badge Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-30 bg-[#d01f5b] text-white text-[9px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded shadow">
                      Accused
                    </div>
                  )}

                  {/* Suspect Photo (Grayscale, colors and scales on hover) */}
                  <div className="absolute inset-0 w-full h-full bg-black z-0">
                    {/* Backup Gradient Backdrop */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${suspect.gradient} z-0 opacity-80`} />
                    
                    
                    <img
                      src={suspect.image}
                      alt={suspect.name}
                      className="w-full h-full object-cover grayscale transition-all duration-700 scale-100 group-hover:grayscale-0 group-hover:scale-105 opacity-80 mix-blend-screen"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  {/* Hover Slider Details Panel */}
                  {/* Default state: translates down to only show header top 64px. Hover state: translates up to show detail text */}
                  <div className="absolute bottom-0 left-0 right-0 bg-zinc-950/95 border-t border-zinc-800 p-5 transition-transform duration-500 translate-y-[calc(100%-64px)] group-hover:translate-y-0 z-10 flex flex-col justify-start">
                    
                    {/* Top Header Always Visible */}
                    <div className="h-11 flex flex-col justify-center">
                      <h3 
                        className={`font-bold text-zinc-100 text-base tracking-wide leading-tight ${
                          isSelected ? "text-[#d01f5b]" : "group-hover:text-[#d01f5b]"
                        } transition-colors`}
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        {suspect.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider mt-0.5">
                        {suspect.role}
                      </p>
                    </div>

                    {/* Slider Reveal Bio Details */}
                    <div className="mt-3 border-t border-zinc-900 pt-3 flex-1 overflow-y-auto max-h-[22vh]">
                      <p className="text-[11px] leading-relaxed text-zinc-400 font-sans font-light">
                        {suspect.bio}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accused Drop Zone */}
          <div className="w-full max-w-4xl mx-auto mt-2">
            <h3 
              className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Primary Accused (Drag 2 Suspects Here or Click Cards)
            </h3>
            
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950 rounded-2xl min-h-[110px] items-center transition"
            >
              {/* Slot 1 */}
              <div className="border border-zinc-800 bg-zinc-900/20 p-3 rounded-xl flex items-center justify-between min-h-[70px]">
                {selectedSuspects[0] ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-13 rounded overflow-hidden bg-black border border-zinc-800 flex-shrink-0">
                      <img src={selectedSuspects[0].image} className="w-full h-full object-cover grayscale mix-blend-screen" alt="" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-200 text-sm">{selectedSuspects[0].name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{selectedSuspects[0].role}</p>
                    </div>
                    <button 
                      onClick={() => removeSuspectFromSelection(0)}
                      className="text-zinc-400 hover:text-white text-xs cursor-pointer font-semibold bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 rounded-lg border border-zinc-800 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="w-full text-center text-zinc-600 text-xs font-mono italic">
                    Drag first suspect here...
                  </div>
                )}
              </div>

              {/* Slot 2 */}
              <div className="border border-zinc-800 bg-zinc-900/20 p-3 rounded-xl flex items-center justify-between min-h-[70px]">
                {selectedSuspects[1] ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-13 rounded overflow-hidden bg-black border border-zinc-800 flex-shrink-0">
                      <img src={selectedSuspects[1].image} className="w-full h-full object-cover grayscale mix-blend-screen" alt="" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-200 text-sm">{selectedSuspects[1].name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{selectedSuspects[1].role}</p>
                    </div>
                    <button 
                      onClick={() => removeSuspectFromSelection(1)}
                      className="text-zinc-400 hover:text-white text-xs cursor-pointer font-semibold bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 rounded-lg border border-zinc-800 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="w-full text-center text-zinc-600 text-xs font-mono italic">
                    Drag second suspect here...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="w-full max-w-6xl mx-auto border-t border-zinc-900 pt-3 text-center text-[10px] text-zinc-600 font-mono">
            Hover over a suspect photo to view dossier profiles. Drag cards or click to accuse.
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
