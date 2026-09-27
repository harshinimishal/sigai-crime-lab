"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";

export function AudioPlayer() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Active routes where BGM should play
  const isAudioActiveRoute =
    pathname.startsWith("/round") || pathname.startsWith("/results");

  // Load mute state from localStorage on mount
  useEffect(() => {
    const savedMute = localStorage.getItem("bgm_muted");
    if (savedMute !== null) {
      setIsMuted(savedMute === "true");
    }
  }, []);

  // Update audio element properties when mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
    localStorage.setItem("bgm_muted", String(isMuted));
  }, [isMuted]);

  // Handle play/pause based on route and interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isAudioActiveRoute) {
      const playAudio = () => {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.log("Autoplay blocked or audio interrupted:", err);
            setIsPlaying(false);
          });
      };

      playAudio();

      // If autoplay was blocked, try to play on any user click
      const handleUserInteraction = () => {
        if (audio.paused && isAudioActiveRoute) {
          playAudio();
        }
        removeInteractionListeners();
      };

      const addInteractionListeners = () => {
        window.addEventListener("click", handleUserInteraction);
        window.addEventListener("keydown", handleUserInteraction);
        window.addEventListener("touchstart", handleUserInteraction);
      };

      const removeInteractionListeners = () => {
        window.removeEventListener("click", handleUserInteraction);
        window.removeEventListener("keydown", handleUserInteraction);
        window.removeEventListener("touchstart", handleUserInteraction);
      };

      addInteractionListeners();

      return () => {
        removeInteractionListeners();
      };
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [isAudioActiveRoute]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    const audio = audioRef.current;
    if (audio && isAudioActiveRoute && audio.paused) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => console.log("Failed to play on toggle:", err));
    }
  };

  if (!isAudioActiveRoute) {
    return (
      <audio
        ref={audioRef}
        src="/audio/background-score.mp3"
        loop
        preload="auto"
      />
    );
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/background-score.mp3"
        loop
        preload="auto"
      />
      <button
        onClick={toggleMute}
        className="
          fixed
          top-4
          right-16
          z-[250]
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          border
          border-zinc-800
          bg-black/40
          backdrop-blur-md
          text-white
          shadow-lg
          transition-all
          duration-300
          hover:scale-105
          hover:bg-zinc-900/60
          hover:border-zinc-700
          active:scale-95
          cursor-pointer
        "
        title={isMuted ? "Unmute Background Music" : "Mute Background Music"}
        aria-label={isMuted ? "Unmute Background Music" : "Mute Background Music"}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-zinc-400" />
        ) : (
          <Volume2 className="h-5 w-5 text-[#d01f5b] animate-pulse" />
        )}
      </button>
    </>
  );
}
