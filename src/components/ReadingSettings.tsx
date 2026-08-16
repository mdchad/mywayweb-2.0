import { useEffect, useState } from "react";
import { BookOpen, Minus, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  READING_SIZE_MAX,
  READING_SIZE_MIN,
  useReadingSettings,
} from "@/lib/ReadingSettingsContext";

function FontSizeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={value <= READING_SIZE_MIN}
          onClick={() => onChange(value - 1)}
          aria-label="Kecilkan saiz"
        >
          <Minus size={14} />
        </Button>
        <span className="w-6 text-center font-mono text-sm tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={value >= READING_SIZE_MAX}
          onClick={() => onChange(value + 1)}
          aria-label="Besarkan saiz"
        >
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );
}

function ReadingSettingsPanel() {
  const {
    arabicSize,
    translationSize,
    setArabicSize,
    setTranslationSize,
  } = useReadingSettings();

  return (
    <div className="mt-6 space-y-6 flex-1">
      <FontSizeRow
        label="Saiz Teks Arab"
        value={arabicSize}
        onChange={setArabicSize}
      />
      <FontSizeRow
        label="Saiz Terjemahan"
        value={translationSize}
        onChange={setTranslationSize}
      />
    </div>
  );
}

function ReadingResetButton() {
  const { resetSizes } = useReadingSettings();
  return (
    <div className="pt-4 border-t flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs rounded-none"
        onClick={resetSizes}
      >
        Set Semula
      </Button>
    </div>
  );
}

// Auto-hide on scroll-down past `threshold`, reveal on scroll-up. Same
// pattern as quran.com's lang-switch.
function useHideOnScrollDown(threshold = 50) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > threshold && y > last) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return hidden;
}

export default function ReadingSettings({
  readingModeHref,
}: {
  readingModeHref?: string;
} = {}) {
  const hidden = useHideOnScrollDown();

  return (
    <div
      className={`fixed bottom-0 md:top-20 right-0 md:right-3 lg:right-8 z-[20] flex items-center gap-1 transition-[opacity,transform] ${
        hidden
          ? "opacity-0 pointer-events-none"
          : "opacity-100 translate-y-0"
      }`}
    >
      {readingModeHref && (
        <a
          href={readingModeHref}
          aria-label="Mode Bacaan"
          title="Mode Bacaan"
          className="inline-flex h-9 w-9 items-center justify-center border bg-white text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <BookOpen size={18} />
        </a>
      )}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Tetapan bacaan"
            title="Tetapan bacaan"
            className="bg-white shadow-none rounded-none"
          >
            <Settings size={18} />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 sm:max-w-sm flex flex-col">
          <SheetHeader>
            <SheetTitle className="sr-only"></SheetTitle>
          </SheetHeader>
          <ReadingSettingsPanel />
          <ReadingResetButton />
        </SheetContent>
      </Sheet>
    </div>
  );
}
