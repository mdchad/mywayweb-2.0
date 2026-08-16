import SpecialText from "@/components/SpecialText";
import QuranText from "@/components/QuranText";
import { useRef, useState, useEffect, useMemo, Fragment } from "react";
import { Link } from "@tanstack/react-router";
import SurahContainer from "@/components/SurahContainer";
import FootnoteText from "@/components/FootnoteText";
import ChapterRenderer from "@/components/ChapterRenderer";
import HadithRenderer from "@/components/HadithRenderer";
import ScrollTopButton from "@/components/ScrollTopButton";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import { toast } from "sonner";
import { ReadingSettingsProvider } from "@/lib/ReadingSettingsContext";
import ReadingSettings from "@/components/ReadingSettings";
import type {
  Book,
  Chapter,
  Footnote,
  HadithWithFootnotes,
  Volume,
} from "@/lib/types/hadith";

type ChapterWithHadiths = Chapter & {
  footnotes: Footnote[];
  hadiths: HadithWithFootnotes[];
};

interface HadithContainerProps {
  chapters: ChapterWithHadiths[];
  volumeFootnotes: Footnote[];
  volume: Volume;
  book: Book;
  surahs: any[];
  slug: string;
  volumeParam: string;
  totalCount: number;
}

const isAr = (f: Footnote) => f.language === "ar";

// True chapter-first layout: kitab → chapter → hadith hierarchy is reflected
// in the DOM. The body is one big CSS Grid with three columns
// [1fr | auto | 1fr]; each chapter and each hadith is a single row in that
// grid. Vertical border-x lines stay continuous across rows because all
// middle cells use the same width and border. Each row owns its own <aside>
// in the right column, so the footnote-alignment math stays local — sidenote
// overlap math resets at every row boundary, giving the correct visual
// behaviour without the "first hadith of partition" hack or the cross-
// section negative-offset workaround.
function HadithContainerInner({
  chapters: initialChapters,
  volumeFootnotes,
  volume,
  book,
  surahs,
  slug,
  volumeParam,
}: HadithContainerProps) {
  const { playAllHadiths, isPlayingAll, isPlaying } = useAudioPlayer();

  const [chapters] = useState(initialChapters);
  const refs = useRef<Record<number, HTMLElement | null>>({});
  const footnoteRefs = useRef<Record<string, HTMLElement | null>>({});
  const sidenoteRefs = useRef<Record<string, HTMLElement | null>>({});

  // Flat hadith list for audio play-all / scroll button / currentId tracking.
  const allHadiths = useMemo(
    () => chapters.flatMap((c) => c.hadiths),
    [chapters],
  );

  const [currentId, setCurrentId] = useState({
    id: 1,
    number: allHadiths[0]?.number || 1,
  });

  const handlePlayAll = () => {
    const hadithsWithAudio = allHadiths.filter(
      (h) => h.audio_files && Object.keys(h.audio_files).length > 0,
    );

    if (hadithsWithAudio.length === 0) {
      toast.error("Tiada Audio Dijumpai", {
        description: "Tiada hadis dengan audio dalam juzuk ini.",
      });
      return;
    }

    playAllHadiths(allHadiths, slug);
    toast.success("Memainkan Semua Hadis", {
      description:
        "Audio akan dimainkan secara berurutan: Arab dahulu, kemudian Melayu.",
    });
  };

  // Effect to align sidenotes with footnote markers, with overlap prevention.
  // Internally debounced via setTimeout(150ms) below.
  useEffect(() => {
    const alignSidenotes = () => {
      const asideElements = new Set<Element>();

      // Collect all unique aside containers
      // With virtual scrolling, only visible items have refs populated
      Object.keys(sidenoteRefs.current).forEach((key) => {
        const el = sidenoteRefs.current[key];
        if (el) {
          const aside = el.closest("aside");
          if (aside) asideElements.add(aside);
        }
      });

      // Process each aside independently
      asideElements.forEach((asideElement) => {
        const sidenotes: Array<{
          key: string;
          element: HTMLElement;
          targetTop: number;
        }> = [];

        // Collect all sidenotes in this aside with their target positions
        Object.keys(sidenoteRefs.current).forEach((key) => {
          const sidenoteEl = sidenoteRefs.current[key];
          const markerEl = footnoteRefs.current[key];

          if (
            sidenoteEl &&
            markerEl &&
            sidenoteEl.closest("aside") === asideElement
          ) {
            // Use parentElement (wrapper or aside) as the positioning reference
            // This allows footnotes to reference markers from outside the aside
            // (e.g., volume footnotes referencing markers in the volume section)
            const containerRect =
              sidenoteEl.parentElement!.getBoundingClientRect();
            const markerRect = markerEl.getBoundingClientRect();
            const targetTop = markerRect.top - containerRect.top;
            sidenotes.push({ key, element: sidenoteEl, targetTop });
          }
        });

        // Sort by target position
        sidenotes.sort((a, b) => a.targetTop - b.targetTop);

        // Apply positions with overlap collision detection
        // This algorithm ensures sidenotes follow their markers when possible,
        // but cascade downward when they would overlap
        //
        // VISUAL DIAGRAM:
        //
        // CENTER COLUMN              RIGHT COLUMN (aside)
        // ───────────────────────    ─────────────────────
        // Lorem ipsum[¹]              ┌─────────────────┐
        // dolor sit amet[²]        →  │ [¹] Note text   │ ← positioned at marker 1
        //                             └─────────────────┘ (no overlap, stays at target)
        // consectetur[³]
        // adipiscing                  ┌─────────────────┐
        //                             │ [²] Note text   │ ← WOULD overlap!
        //                             └─────────────────┘ → SHIFTS DOWN to avoid
        //
        // sed do eiusmod[⁴]           ┌─────────────────┐
        //                             │ [³] Note text   │ ← far below, no conflict
        //                             └─────────────────┘ (stays at target)
        //
        // ALGORITHM:
        // 1. Sort sidenotes by marker position (top to bottom)
        // 2. For each sidenote:
        //    - Calculate targetTop (where it should be)
        //    - If negative (marker from other section): allow it, don't constrain
        //    - If positive: check if it would overlap with lastBottom
        //    - If overlap: shift down to lastBottom + padding
        //    - If no overlap: keep targetTop
        //    - Update lastBottom = finalTop + height
        //
        let lastBottom = 0; // Tracks the bottom edge of the previous sidenote

        sidenotes.forEach(({ element, targetTop }) => {
          // Get the actual rendered height of this sidenote
          const height = element.offsetHeight;
          const padding = 8; // Minimum gap between sidenotes

          // Overlap detection and prevention:
          // Allow negative positions (markers from other sections like volume titles)
          // Only apply overlap detection for sidenotes within this section (targetTop >= 0)
          //
          // Example with cross-section markers:
          // - Volume footnote: targetTop = -200px (marker above) → use -200px
          // - First hadith: targetTop = 50px → if lastBottom = 0, use 50px
          // - Second hadith: targetTop = 60px → if lastBottom = 90, use 98px (shift down)
          let finalTop: number;

          if (targetTop < 0) {
            // Negative position = marker from another section (e.g., volume title)
            // Allow it to position at its natural height
            finalTop = targetTop;
          } else {
            // Positive position = marker within this section
            // Apply overlap detection
            finalTop = Math.max(targetTop, lastBottom + padding);
          }

          // Apply the calculated position
          element.style.position = "absolute";
          element.style.top = `${finalTop}px`;
          element.style.left = "0";

          // Update lastBottom for the next sidenote:
          // Only track positive sidenotes for overlap detection
          // (ignore cross-section footnotes)
          if (finalTop >= 0) {
            lastBottom = finalTop + height;
          }
        });
      });
    };

    // Debounce to avoid running too frequently during rapid scrolling
    const timer = setTimeout(alignSidenotes, 150);
    window.addEventListener("resize", alignSidenotes);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", alignSidenotes);
    };
  }, [chapters]);

  // Volume_title footnote anchor. Synthesised so the footnote ref keys
  // remain unique across the page.
  const volumeFootnoteHostId = `volume-${volume.id}`;

  // Renders a single sidenote bubble (footnote in the right aside column).
  // hostId is whatever entity owns the footnote: volume id for volume-scoped,
  // chapter.id for chapter-scoped, hadith.id for hadith-scoped. The marker
  // (rendered by FootnoteText) registers under the same key so the align
  // effect can match marker → sidenote.
  const renderSidenote = (
    hostId: string,
    footnote: Footnote,
    footnoteIndex: number,
    opts: { volumeStyle?: boolean } = {},
  ) => {
    const isVolume = opts.volumeStyle || footnote.scope === "volume";
    return (
      <div
        key={`${hostId}-${footnoteIndex}`}
        ref={(el) => {
          if (el) {
            const key = `${hostId}-${footnote.number}`;
            sidenoteRefs.current[key] = el;
          }
        }}
        className={`bg-white mt-2 pr-10 text-justify flex items-start gap-2 text-sm ${
          isVolume ? "bg-white rounded-sm" : ""
        }`}
      >
        <span
          className={`shrink-0 ${
            isVolume ? "text-black/70" : "text-blue-900/80"
          } text-xs font-mono rounded-full flex items-center justify-center`}
        >
          {footnote.number}
        </span>
        <p
          className={isVolume ? "text-black/70" : "text-[#87898C]"}
          {...(isAr(footnote) ? { lang: "ar", dir: "rtl" as const } : {})}
        >
          <QuranText
            text={footnote.content}
            font={isAr(footnote) ? "font-arabic" : "font-sans"}
            className="leading-relaxed"
          />
        </p>
      </div>
    );
  };

  // Mobile inline footnote (rendered in the centre column on small screens
  // since the right aside is hidden below lg).
  const renderMobileFootnote = (
    hostId: string,
    footnote: Footnote,
    footnoteIndex: number,
  ) => (
    <div
      key={`${hostId}-${footnoteIndex}`}
      id={`footnote-${hostId}-${footnote.number}`}
      className="mt-2 flex items-start space-x-2 scroll-mt-20 target:bg-[#e8eeff]"
    >
      <span className="text-blue-900/80 text-xs font-bold">{footnote.number}</span>
      <p
        className={isAr(footnote) ? "text-gray-500 font-arabic" : "text-gray-500"}
        {...(isAr(footnote) ? { lang: "ar", dir: "rtl" as const } : {})}
      >
        {footnote.content}
      </p>
    </div>
  );

  return (
    <>
      <div className="">
        {/* Volume header — its own grid. The right column is now an <aside>
            that hosts the volume-title sidenotes alongside the existing
            decorative pattern. Marker in the centre column, sidenote in the
            same grid row's right aside → naturally local alignment. */}
        <div className="grid lg:grid-cols-[1fr_auto_1fr] grid-cols-[1fr]">
          <div className="bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef] border-b-1 border-gray-100/50"></div>
          <div className="py-8 px-10 bg-royal-blue lg:w-4xl w-full">
            <FootnoteText
              footnotes={volumeFootnotes}
              type={"volume_title.ms"}
              index={1}
              footnoteRefs={footnoteRefs}
              hadithId={volumeFootnoteHostId}
            >
              <h1 className="text-3xl font-bold text-white text-left font-serif">
                {volume.title_ms}
              </h1>
            </FootnoteText>
            <p
              lang="ar"
              className="mt-12 text-4xl font-arabic font-bold text-white text-right"
            >
              {volume.title_ar}
            </p>
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handlePlayAll}
                variant="outline"
                className="rounded-none bg-white text-xs text-royal-blue hover:bg-white/90"
              >
                {isPlayingAll && isPlaying ? (
                  <>
                    <Pause size={16} />
                    Sedang Dimainkan
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Main Semua Audio
                  </>
                )}
              </Button>
            </div>
            <div className="mt-8 lg:hidden">
              {volumeFootnotes.map((footnote, footnoteIndex) => (
                <div
                  key={footnoteIndex}
                  id={`footnote-${volumeFootnoteHostId}-${footnote.number}`}
                  className="mt-2 flex items-start space-x-2 text-sm scroll-mt-20 target:bg-blue-900"
                >
                  <span className="shrink-0 text-gray-200/70 text-xs font-bold rounded-full flex items-center justify-center">
                    {footnote.number}
                  </span>
                  <p
                    className={
                      isAr(footnote)
                        ? "text-gray-100/70 font-arabic"
                        : "text-gray-100/70"
                    }
                    {...(isAr(footnote) ? { lang: "ar", dir: "rtl" as const } : {})}
                  >
                    {footnote.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <aside className="relative bg-[repeating-linear-gradient(45deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:#efefef] border-b-1 border-gray-100/50 hidden lg:block lg:p-2">
            {volumeFootnotes.map((footnote, i) =>
              renderSidenote(volumeFootnoteHostId, footnote, i, { volumeStyle: true }),
            )}
          </aside>
        </div>

        {/* Volume metadata — own grid, no sidenotes */}
        {volume.metadata_ms && (
          <div className="grid grid-cols-[1fr_minmax(0,56rem)_1fr]">
            <div className=""></div>
            <div className="w-full max-w-4xl border-x-1 border-gray-200/50 border-b-1 grid-cols-1 text-gray-800 py-10 px-12 grid sm:grid-cols-2 gap-12 mx-auto relative">
              <div className="font-mono uppercase text-xs text-black absolute left-2 top-2">+</div>
              <div className="font-mono uppercase text-xs text-black absolute left-2 bottom-2">+</div>
              <div className="font-mono uppercase text-xs text-black absolute right-2 top-2">+</div>
              <div className="font-mono uppercase text-xs text-black absolute right-2 bottom-2">+</div>

              <p className="order-2 sm:order-1 text-base text-justify font-serif bg-white">
                <SpecialText text={volume.metadata_ms} font={"font-serif"} />
              </p>
              <p
                className="text-xl order-1 sm:order-2 text-justify leading-relaxed bg-white"
                dir="rtl"
              >
                <QuranText text={volume.metadata_ar} />
              </p>
            </div>
            <div className=""></div>
          </div>
        )}

        {/* Body: each chapter and each hadith is its own
            `grid grid-cols-[1fr_auto_1fr]` row (matching the original
            responsive behaviour). All middle cells use the same
            `w-full max-w-4xl` shape, so border-x lines align horizontally
            across rows and the visible card edges flow continuously. Each
            row's right aside is independent → footnote alignment stays
            local to that row. */}
        <div style={{ minHeight: "100vh" }}>
          {(() => {
            let hadithFlatIdx = 0;
            return chapters.map((chapter) => (
              <Fragment key={chapter.id}>
                {/* Chapter row */}
                <div className="grid grid-cols-[1fr_minmax(0,56rem)_1fr] gap-0">
                  <aside></aside>
                  <div className="w-full max-w-4xl p-4 border-x-1 border-gray-200/50">
                    {surahs.length > 0 && chapter.hadiths[0] && (
                      <SurahContainer hadith={chapter.hadiths[0]} surahs={surahs} />
                    )}
                    <div className="before:bg-[size:10px_10px] after:bg-[size:10px_10px] before:border-r-1 before:border-gray-200/50 after:border-l-1 after:border-gray-200/50 relative -mx-4 px-4 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-4 before:bg-[image:repeating-linear-gradient(315deg,transparent,transparent_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)] after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-4 after:bg-[repeating-linear-gradient(315deg,transparent,transparent_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)]">
                      <ChapterRenderer
                        chapter={chapter}
                        footnotes={chapter.footnotes}
                        footnoteRefs={footnoteRefs}
                      />
                    </div>
                    {/* Mobile chapter footnotes */}
                    {chapter.footnotes.length > 0 && (
                      <div className="pr-3 lg:hidden">
                        {chapter.footnotes.map((footnote, i) =>
                          renderMobileFootnote(chapter.id, footnote, i),
                        )}
                      </div>
                    )}
                  </div>
                  <aside className="hidden sm:relative lg:block lg:p-2">
                    {chapter.footnotes.map((footnote, i) =>
                      renderSidenote(chapter.id, footnote, i),
                    )}
                  </aside>
                </div>

                {/* Hadith rows */}
                {chapter.hadiths.map((hadith) => {
                  const flatIdx = hadithFlatIdx++;
                  return (
                    <div
                      key={hadith.id}
                      className="grid grid-cols-[1fr_minmax(0,56rem)_1fr] gap-0"
                    >
                      <aside></aside>
                      <div className="w-full max-w-4xl p-4 border-x-1 border-gray-200/50">
                        <div
                          id={`hadith-${hadith.label.replace("/", "-")}`}
                          className="scroll-mt-20"
                          ref={(el) => {
                            refs.current[flatIdx + 1] = el;
                          }}
                        >
                          <HadithRenderer
                            slug={slug}
                            hadith={hadith}
                            volumeParam={volumeParam}
                            footnoteRefs={footnoteRefs}
                          />
                          <div className="pr-3 lg:hidden">
                            {hadith.footnotes.hadith.map((footnote, i) =>
                              renderMobileFootnote(hadith.id, footnote, i),
                            )}
                          </div>
                        </div>
                      </div>
                      <aside className="hidden sm:relative lg:block lg:p-2">
                        {hadith.footnotes.hadith.map((footnote, i) =>
                          renderSidenote(hadith.id, footnote, i),
                        )}
                      </aside>
                    </div>
                  );
                })}
              </Fragment>
            ));
          })()}
        </div>
      </div>
      <div className="fixed sm:bottom-1 bottom-0 left-1 flex flex-col gap-1">
        <Link
          className="block font-mono text-xs p-2 bg-white hover:-translate-x-0.5 hover:translate-y-0.5 transition-transform duration-200 border-t border-r border-gray-500"
          to="/book/$slug" params={{ slug }}
        >
          ← {book.title_ms}
        </Link>
      </div>
      <ReadingSettings
        readingModeHref={`/read/${slug}/${volumeParam}`}
      />
      <ScrollTopButton
        divRef={refs}
        hadiths={allHadiths}
        setCurrentId={setCurrentId}
        currentId={currentId}
        slug={slug}
      />
    </>
  );
}

function HadithContainer(props: HadithContainerProps) {
  return (
    <ReadingSettingsProvider>
      <HadithContainerInner {...props} />
    </ReadingSettingsProvider>
  );
}

export default HadithContainer;
