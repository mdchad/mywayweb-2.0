import type { MutableRefObject } from "react";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  FileEditIcon,
  Play,
  Share,
  Bookmark,
  Sparkles,
} from "lucide-react";
import QuranText from "@/components/QuranText";
import { Button } from "@/components/ui/button";
import LexicalRenderer from "@/components/LexicalRenderer";
import FootnoteText from "@/components/FootnoteText";
import { useAudioPlayer } from "@/lib/AudioPlayerContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { PlayIcon } from "@/components/ui/play";
import { LinkIcon } from "@/components/ui/link";
import { BookmarkIcon } from "@/components/ui/bookmark";
import { SparklesIcon } from "@/components/ui/sparkles";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import AIChat from "@/components/AIChat";
import { useMediaQuery } from "@/components/hooks/useMediaQuery";
import {
  arabicSizeToRem,
  translationSizeToRem,
  useReadingSettings,
} from "@/lib/ReadingSettingsContext";
import type { HadithWithFootnotes } from "@/lib/types/hadith";

interface HadithRendererProps {
  hadith: HadithWithFootnotes;
  footnoteRefs: MutableRefObject<Record<string, HTMLElement | null>>;
  slug: string;
  volumeParam?: string;
  hideSingleLink?: boolean;
}

function HadithRenderer({
  hadith,
  footnoteRefs,
  slug,
  volumeParam = "",
  hideSingleLink = false,
}: HadithRendererProps) {
  const { playingHadithId, playHadith } = useAudioPlayer();
  const { arabicSize, translationSize } = useReadingSettings();
  const arabicFontSize = arabicSizeToRem(arabicSize);
  const translationFontSize = translationSizeToRem(translationSize);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const hadithFootnotes = hadith.footnotes.hadith;

  const onShareHadith = async (contentIndex: number = 0) => {
    try {
      const hashPart = contentIndex > 0 ? `#${contentIndex}` : "";
      const hadithUrl = `${window.location.origin}/${slug}/${hadith.label}${hashPart}`;
      await navigator.clipboard.writeText(hadithUrl);
      toast.success("Copied to clipboard.");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard.");
    }
  };

  const onBookmarkHadith = () => {};
  const onAIChat = () => setIsDrawerOpen(true);

  const clickPlay = (contentIndex: number = 0) => {
    if (!hadith.audio_files || Object.keys(hadith.audio_files).length === 0) {
      toast.error("File Audio Tidak Dijumpai", {
        description: "File audio untuk hadis ini tidak ditemukan.",
      });
      return;
    }
    if (playingHadithId !== hadith.id) {
      playHadith(hadith, slug, contentIndex);
    }
  };

  return (
    <div ref={contentRef} className="relative">
      {hadith.content.map((content, i) => {
        if (!content.ar) return null;

        return (
          <div
            {...(i > 0 && { id: String(i) })}
            data-content-index={i}
            ref={parentRef}
            key={hadith.id + i}
            className="bg-white px-4 py-8 sm:py-8 sm:px-8 space-y-6 scroll-my-[30vh] target:pulse-highlight relative"
          >
            <TooltipProvider delay={50} key={i}>
              <div className="hidden lg:flex absolute -left-16 top-0 flex-col py-8">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={
                        hideSingleLink
                          ? `/book/${slug}/${volumeParam}#hadith-${hadith.label.replace("/", "-")}`
                          : `/${slug}/${hadith.label}`
                      }
                      aria-label={`Buka halaman Hadis ${hadith.label}`}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <ArrowUpRightIcon size={18} className="text-neutral-500" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="rounded-none bg-royal-blue fill-royal-blue">
                    Buka Halaman Hadis
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button asChild onClick={() => clickPlay(i)} size="icon" variant="ghost">
                      <PlayIcon className="text-neutral-500 cursor-pointer" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="rounded-none bg-royal-blue fill-royal-blue">
                    Mainkan Audio
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button asChild onClick={() => onShareHadith(i)} size="icon" variant="ghost">
                      <LinkIcon className="text-neutral-500 cursor-pointer" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="rounded-none bg-royal-blue fill-royal-blue">
                    Kongsi
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button asChild onClick={onBookmarkHadith} size="icon" variant="ghost">
                      <BookmarkIcon className="text-neutral-500 cursor-pointer" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="rounded-none bg-royal-blue fill-royal-blue">
                    Tanda Hadis
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button asChild onClick={onAIChat} size="icon" variant="ghost">
                      <SparklesIcon className="text-neutral-500 cursor-pointer" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="rounded-none bg-royal-blue fill-royal-blue">
                    Tanya AI
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
            <div
              className="grid-cols-1 lg:grid-cols-2 gap-12 grid relative"
              key={`${hadith.id}_${i}_lexical`}
            >
              {hadith.lexicalState?.content?.[i]?.ms ? (
                <div
                  className="order-2 leading-relaxed lg:order-1 text-base text-justify font-arabic-symbol select-none"
                  style={{ fontSize: translationFontSize }}
                >
                  <LexicalRenderer
                    serializedState={hadith.lexicalState.content[i].ms}
                    lang="ms"
                    dir="ltr"
                    className="leading-relaxed"
                    footnoteRefs={footnoteRefs}
                    hadithId={hadith.id}
                  />
                </div>
              ) : (
                <p
                  className="order-2 leading-relaxed lg:order-1 text-base text-justify whitespace-pre-line font-arabic-symbol select-none"
                  style={{ fontSize: translationFontSize }}
                >
                  <FootnoteText
                    footnotes={hadithFootnotes}
                    type={"content.ms"}
                    index={i + 1}
                    footnoteRefs={footnoteRefs}
                    hadithId={hadith.id}
                  >
                    <QuranText text={content.ms} font="font-arabic-symbol" />
                  </FootnoteText>
                </p>
              )}
              {hadith.lexicalState?.content?.[i]?.ar ? (
                <div
                  lang="ar"
                  dir="rtl"
                  className="order-1 lg:order-2 text-xl text-justify font-arabic leading-[1.8] select-none"
                  style={{ fontSize: arabicFontSize }}
                >
                  <LexicalRenderer
                    serializedState={hadith.lexicalState.content[i].ar}
                    lang="ar"
                    dir="rtl"
                    className="leading-[1.8]"
                    footnoteRefs={footnoteRefs}
                    hadithId={hadith.id}
                  />
                </div>
              ) : (
                <p
                  lang="ar"
                  dir="rtl"
                  className="order-1 lg:order-2 text-xl text-justify whitespace-pre-line font-arabic leading-[1.8] select-none"
                  style={{ fontSize: arabicFontSize }}
                >
                  <FootnoteText
                    footnotes={hadithFootnotes}
                    type={"content.ar"}
                    index={i + 1}
                    footnoteRefs={footnoteRefs}
                    hadithId={hadith.id}
                  >
                    <QuranText text={content.ar} />
                  </FootnoteText>
                </p>
              )}
            </div>
            <div className="mt-8 hidden lg:flex w-full justify-end" key={`${hadith.id}_${i}`}>
              <Button className="rounded-none cursor-pointer text-xs" onClick={() => clickPlay(i)}>
                <Play size={16} color={"white"} />
                Main Audio
              </Button>
            </div>

            <div className="mt-2 flex justify-end lg:hidden gap-0" key={`${hadith.id}_${i}_mobile`}>
              <Button className="rounded-none cursor-pointer text-xs" onClick={() => clickPlay(i)}>
                <Play size={16} color={"white"} />
                Main Audio
              </Button>
              <Button size="icon" onClick={() => onShareHadith(i)} variant="ghost">
                <Share size={16} className="stroke-neutral-500" />
              </Button>
              <Button size="icon" onClick={onBookmarkHadith} variant="ghost">
                <Bookmark size={16} className="stroke-neutral-500" />
              </Button>
              <Button size="icon" onClick={onAIChat} variant="ghost" title="Tanya AI">
                <Sparkles size={16} className="stroke-neutral-500" />
              </Button>
              {!hideSingleLink && (
                <Button size="icon" variant="ghost" asChild title="Buka Halaman Hadis">
                  <a
                    href={`/${slug}/${hadith.label}`}
                    aria-label={`Buka halaman Hadis ${hadith.label}`}
                  >
                    <ArrowUpRight size={16} className="stroke-neutral-500" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {(process.env.NEXT_PUBLIC_ENV_RUNTIME === "localhost" ||
        process.env.NEXT_PUBLIC_ENV_RUNTIME === "development") && (
        <div className="mt-2 flex gap-2" key={`${hadith.id}_edit`}>
          <Button asChild>
            <a
              href={`/admin/${hadith.id}?volume=${hadith.volume_id}&bookId=${hadith.book_id}`}
            >
              Edit
              <FileEditIcon size={16} color={"white"} />
            </a>
          </Button>
        </div>
      )}

      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        direction={isDesktop ? "right" : "bottom"}
        key={`${hadith.id}_AI_drawer`}
      >
        <DrawerContent className="h-[100dvh] mt-0 lg:h-full lg:inset-y-0">
          <DrawerHeader className="sr-only">
            <DrawerTitle>AI Chat</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col h-full overflow-hidden">
            <AIChat hadith={hadith} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default HadithRenderer;
