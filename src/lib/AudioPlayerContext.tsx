// @ts-nocheck

"use client";

import React, { createContext, useContext, useRef, useState, ReactNode } from "react";

const R2_BASE_URL = "https://pub-34bac4a6ce3242dabed8105f8908b2ee.r2.dev/myway-voiceover";

interface AudioPlayerContextType {
  playingHadithId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  currentLanguage: string;
  isPlayingAll: boolean;
  playHadith: (hadith: any, slug: string, contentIndex?: number) => void;
  playAllHadiths: (hadiths: any[], slug: string, startIndex?: number) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  closePlayer: () => void;
  skipToNextHadith: (hadiths: any[], slug: string) => void;
  skipToPreviousHadith: (hadiths: any[], slug: string) => void;
  changeLanguage: (language: string) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined
);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [playingHadithId, setPlayingHadithId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>("ar");
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const playingHadithRef = useRef<any>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<any[]>([]);
  const currentTrackRef = useRef(0);
  const allHadithsRef = useRef<any[]>([]);
  const currentHadithIndexRef = useRef(0);
  const isPlayingAllRef = useRef(false);

  const createPlaylist = (hadith: any, slug: string, startContentIndex: number = 0) => {
    const playlist = [];

    // Check if hadith has audio_files field
    if (!hadith.audio_files) {
      return playlist;
    }

    hadith.content.forEach((content: any, i: number) => {
      // Skip content blocks before the start index
      if (i < startContentIndex) {
        return;
      }

      const contentKey = `content${i}`;

      // Add Arabic first, then Malay for each content block
      if (hadith.audio_files.ar?.[contentKey]) {
        playlist.push({
          language: "ar",
          contentIndex: i,
          url: `${R2_BASE_URL}/${hadith.audio_files.ar[contentKey]}`,
        });
      }

      if (hadith.audio_files.ms?.[contentKey]) {
        playlist.push({
          language: "ms",
          contentIndex: i,
          url: `${R2_BASE_URL}/${hadith.audio_files.ms[contentKey]}`,
        });
      }
    });

    return playlist;
  };

  const playNextTrack = () => {
    // Check if current hadith playlist is complete
    if (currentTrackRef.current >= playlistRef.current.length) {
      // If playing all hadiths, move to next hadith
      if (isPlayingAllRef.current && currentHadithIndexRef.current < allHadithsRef.current.length - 1) {
        currentHadithIndexRef.current++;
        const nextHadith = allHadithsRef.current[currentHadithIndexRef.current];
        playlistRef.current = createPlaylist(nextHadith, "");
        currentTrackRef.current = 0;
        setPlayingHadithId(nextHadith._id);
        playNextTrack();
        return;
      }

      // Otherwise, stop playback
      setIsPlaying(false);
      setPlayingHadithId(null);
      setIsPlayingAll(false);
      isPlayingAllRef.current = false;
      currentTrackRef.current = 0;
      return;
    }

    const track = playlistRef.current[currentTrackRef.current];
    audioRef.current = new Audio(track.url);

    audioRef.current.onloadedmetadata = () => {
      setDuration(audioRef.current?.duration || 0);
    };

    audioRef.current.ontimeupdate = () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
    };

    audioRef.current.onended = () => {
      currentTrackRef.current++;
      playNextTrack();
    };

    audioRef.current.onerror = () => {
      console.error(`Error loading audio: ${track.url}`);
      currentTrackRef.current++;
      playNextTrack();
    };

    audioRef.current
      .play()
      .catch((error) => {
        console.error("Error playing audio:", error);
        currentTrackRef.current++;
        playNextTrack();
      });
  };

  const playHadith = (hadith: any, slug: string, contentIndex: number = 0) => {
    if (playingHadithId === hadith._id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setPlayingHadithId(null);
      setIsPlayingAll(false);
      isPlayingAllRef.current = false;
      currentTrackRef.current = 0;
      setCurrentTime(0);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setIsPlayingAll(false);
      isPlayingAllRef.current = false;
      playlistRef.current = createPlaylist(hadith, slug, contentIndex);
      currentTrackRef.current = 0;
      setPlayingHadithId(hadith._id);
      setIsPlaying(true);
      playNextTrack();
    }
  };

  const playAllHadiths = (hadiths: any[], slug: string, startIndex: number = 0) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Filter out hadiths that don't have audio files
    const hadithsWithAudio = hadiths.filter(h => h.audio_files);

    if (hadithsWithAudio.length === 0) {
      console.error("No hadiths with audio files found");
      return;
    }

    // Store all hadiths and set index
    allHadithsRef.current = hadithsWithAudio;
    currentHadithIndexRef.current = startIndex;

    // Start with the first hadith
    const firstHadith = hadithsWithAudio[startIndex];
    playlistRef.current = createPlaylist(firstHadith, slug);
    currentTrackRef.current = 0;

    setIsPlayingAll(true);
    isPlayingAllRef.current = true;
    setPlayingHadithId(firstHadith._id);
    setIsPlaying(true);
    playNextTrack();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else if (playingHadithId && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setPlayingHadithId(null);
    setIsPlayingAll(false);
    isPlayingAllRef.current = false;
    currentTrackRef.current = 0;
    setCurrentTime(0);
    setDuration(0);
  };

  const skipToNextHadith = (hadiths: any[], slug: string) => {
    if (!playingHadithId || !hadiths) return;

    // Find the current hadith index
    const currentIndex = hadiths.findIndex(
      (h) => h._id === playingHadithId
    );

    // Get the next hadith
    if (currentIndex !== -1 && currentIndex < hadiths.length - 1) {
      const nextHadith = hadiths[currentIndex + 1];
      playHadith(nextHadith, slug);
    }
  };

  const skipToPreviousHadith = (hadiths: any[], slug: string) => {
    if (!playingHadithId || !hadiths) return;

    // Find the current hadith index
    const currentIndex = hadiths.findIndex(
      (h) => h._id === playingHadithId
    );

    // Get the previous hadith
    if (currentIndex > 0) {
      const previousHadith = hadiths[currentIndex - 1];
      playHadith(previousHadith, slug);
    }
  };

  const changeLanguage = (targetLanguage: string) => {
    // Find the next track in the playlist with the target language
    const currentPlaylistLength = playlistRef.current.length;
    let nextTrackIndex = -1;

    // Start searching from the next track after current one
    for (let i = currentTrackRef.current + 1; i < currentPlaylistLength; i++) {
      if (playlistRef.current[i].language === targetLanguage) {
        nextTrackIndex = i;
        break;
      }
    }

    // If not found in forward direction, search from the beginning
    if (nextTrackIndex === -1) {
      for (let i = 0; i < currentTrackRef.current; i++) {
        if (playlistRef.current[i].language === targetLanguage) {
          nextTrackIndex = i;
          break;
        }
      }
    }

    // If found, skip to that track
    if (nextTrackIndex !== -1) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      currentTrackRef.current = nextTrackIndex;
      setCurrentLanguage(targetLanguage);
      playNextTrack();
    }
  };

  const value: AudioPlayerContextType = {
    playingHadithId,
    currentTime,
    duration,
    isPlaying,
    currentLanguage,
    isPlayingAll,
    playHadith,
    playAllHadiths,
    togglePlayPause,
    seekTo,
    closePlayer,
    skipToNextHadith,
    skipToPreviousHadith,
    changeLanguage,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
