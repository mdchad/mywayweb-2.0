// @ts-nocheck

"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  X, SkipForward, SkipBack, Languages
} from "lucide-react";
import {
  ScrubBarContainer,
  ScrubBarTrack,
  ScrubBarProgress,
  ScrubBarThumb,
  ScrubBarTimeLabel,
} from "@/components/ui/scrub-bar";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";

const ScrollTopButton = ({ divRef, setCurrentId, currentId, hadiths, slug }) => {
  const { currentTime, duration, isPlaying, playingHadithId, currentLanguage, seekTo, togglePlayPause, closePlayer, skipToNextHadith, skipToPreviousHadith, changeLanguage } = useAudioPlayer();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (playingHadithId) {
      setIsClosing(false);
    }
  }, [playingHadithId]);

  const handleClosePlayer = () => {
    setIsClosing(true);
    setTimeout(() => {
      closePlayer();
    }, 300);
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === "ar" ? "ms" : "ar";
    changeLanguage(newLanguage);
  };

  return (
    <div
      className={`flex flex-col items-center fixed bottom-4 left-1/2 transform -translate-x-1/2 p-2 bg-white w-64 shadow-2xl border-double border-x-4 border-t-4 border-[#3b82f699] transition-all duration-300 ease-out ${
        playingHadithId && !isClosing
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-full pointer-events-none"
      }`}
    >
      {playingHadithId && (
        <>
          <ScrubBarContainer duration={duration} value={currentTime} onScrub={seekTo}>
            <ScrubBarTimeLabel time={currentTime} className="text-sm font-mono text-neutral-600"/>
            <ScrubBarTrack className="mx-2 h-1">
              <ScrubBarProgress className="h-1"/>
              <ScrubBarThumb className="size-3"/>
            </ScrubBarTrack>
            <ScrubBarTimeLabel time={duration} className="text-sm font-mono text-neutral-600"/>
          </ScrubBarContainer>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={`Language: ${currentLanguage === "ar" ? "العربية" : "Melayu"}`}
            >
              <Languages size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skipToPreviousHadith(hadiths, slug)}>
              <SkipBack size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlayPause}>
              {isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skipToNextHadith(hadiths, slug)}>
              <SkipForward size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClosePlayer}>
              <X size={18} />
            </Button>
          </div>
          {playingHadithId && hadiths && (
            <div className="text-center text-sm">
              <p className="font-medium text-neutral-700">
                [{hadiths.find((h: any) => h._id === playingHadithId)?.number}] <span className="text-xs text-neutral-500">{currentLanguage === "ar" ? "العربية" : "Bahasa Melayu"}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScrollTopButton;
