import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ReadingSettings = {
  arabicSize: number; // stepper level (1..7); 4 == current default
  translationSize: number; // stepper level (1..7); 4 == current default
  setArabicSize: (n: number) => void;
  setTranslationSize: (n: number) => void;
  resetSizes: () => void;
};

export const READING_SIZE_MIN = 1;
export const READING_SIZE_MAX = 7;
const ARABIC_DEFAULT_LEVEL = 3;
const DEFAULT_LEVEL = 4;

// rem values per stepper level. Index 3 (level 4) matches the current
// `text-xl` (Arabic) and `text-base` (translation) defaults so the
// component is a no-op until the user changes a setting.
const ARABIC_REM = [1.0, 1.125, 1.25, 1.5, 1.75, 2.0, 2.25];
const TRANSLATION_REM = [0.75, 0.875, 0.9375, 1.0, 1.125, 1.25, 1.5];

const clampLevel = (n: number) =>
  Math.min(READING_SIZE_MAX, Math.max(READING_SIZE_MIN, Math.round(n)));

export const arabicSizeToRem = (level: number): string =>
  `${ARABIC_REM[clampLevel(level) - 1]}rem`;

export const translationSizeToRem = (level: number): string =>
  `${TRANSLATION_REM[clampLevel(level) - 1]}rem`;

const STORAGE_KEY_ARABIC = "reading.arabicSize";
const STORAGE_KEY_TRANSLATION = "reading.translationSize";

const ReadingSettingsContext = createContext<ReadingSettings | null>(null);

export function ReadingSettingsProvider({ children }: { children: ReactNode }) {
  const [arabicSize, setArabicSizeState] = useState(DEFAULT_LEVEL);
  const [translationSize, setTranslationSizeState] = useState(DEFAULT_LEVEL);

  useEffect(() => {
    try {
      const a = localStorage.getItem(STORAGE_KEY_ARABIC);
      const t = localStorage.getItem(STORAGE_KEY_TRANSLATION);
      if (a) setArabicSizeState(clampLevel(Number(a)));
      if (t) setTranslationSizeState(clampLevel(Number(t)));
    } catch {
      // localStorage may be unavailable (SSR safety / private mode); ignore.
    }
  }, []);

  const setArabicSize = (n: number) => {
    const v = clampLevel(n);
    setArabicSizeState(v);
    try {
      localStorage.setItem(STORAGE_KEY_ARABIC, String(v));
    } catch {}
  };

  const setTranslationSize = (n: number) => {
    const v = clampLevel(n);
    setTranslationSizeState(v);
    try {
      localStorage.setItem(STORAGE_KEY_TRANSLATION, String(v));
    } catch {}
  };

  const resetSizes = () => {
    setArabicSize(DEFAULT_LEVEL);
    setTranslationSize(DEFAULT_LEVEL);
  };

  return (
    <ReadingSettingsContext.Provider
      value={{
        arabicSize,
        translationSize,
        setArabicSize,
        setTranslationSize,
        resetSizes,
      }}
    >
      {children}
    </ReadingSettingsContext.Provider>
  );
}

// Returning defaults outside the provider (e.g. in SingleHadithClient) means
// HadithRenderer renders at the current default sizes without throwing.
export function useReadingSettings(): ReadingSettings {
  const ctx = useContext(ReadingSettingsContext);
  if (ctx) return ctx;
  return {
    arabicSize: ARABIC_DEFAULT_LEVEL,
    translationSize: DEFAULT_LEVEL,
    setArabicSize: () => {},
    setTranslationSize: () => {},
    resetSizes: () => {},
  };
}
