import type { MutableRefObject } from "react";
import SpecialText from "@/components/SpecialText";
import QuranText from "@/components/QuranText";
import LexicalRenderer from "@/components/LexicalRenderer";
import FootnoteText from "@/components/FootnoteText";
import type { Chapter, Footnote } from "@/lib/types/hadith";

interface ChapterRendererProps {
  chapter: Chapter;
  footnotes: Footnote[];
  footnoteRefs: MutableRefObject<Record<string, HTMLElement | null>>;
}

function ChapterRenderer({ chapter, footnotes, footnoteRefs }: ChapterRendererProps) {
  const lexicalState = chapter.lexicalState ?? {};
  return (
    <div className="relative before:h-px before:content-[''] before:top-0 before:left-[50%] before:w-[100vw] before:absolute before:bg-gray-200/50 before:-translate-x-1/2 after:h-px after:content-[''] after:bottom-0 after:left-[50%] after:w-[100vw] after:absolute after:bg-gray-200/50 after:-translate-x-1/2 gap-6 grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] lg:gap-12 md:grid-cols-2 my-6 grid p-2 lg:px-8">
      <div className="order-2 sm:order-1">
        <h2 className="text-sm text-justify text-royal-blue font-bold select-none leading-relaxed">
          <FootnoteText
            footnotes={footnotes}
            type={"chapter_title.ms"}
            index={1}
            footnoteRefs={footnoteRefs}
            hadithId={chapter.id}
          >
            <SpecialText text={chapter.title_ms} />
          </FootnoteText>
        </h2>
        <p className="font-sans font-normal text-sm text-justify text-gray-500 select-none leading-relaxed">
          {chapter.transliteration_ms}
        </p>
      </div>

      <p
        lang="ar"
        dir="rtl"
        className="order-1 sm:order-2 text-xl text-royal-blue text-justify font-arabic leading-[1.8]"
      >
        <QuranText text={chapter.title_ar} className="font-bold" />
      </p>
      {chapter.metadata_ms && (
        <>
          {lexicalState?.metadata_ms ? (
            <div className="order-4 sm:order-3 leading-relaxed text-base text-justify whitespace-pre-line font-arabic-symbol text-gray-600 select-none">
              <LexicalRenderer
                serializedState={lexicalState.metadata_ms}
                lang="ms"
                dir="ltr"
                className="leading-relaxed"
                footnoteRefs={footnoteRefs}
                hadithId={chapter.id}
              />
            </div>
          ) : (
            <p className="order-4 sm:order-3 leading-relaxed text-base text-justify whitespace-pre-line font-arabic-symbol text-gray-600 select-none">
              <FootnoteText
                footnotes={footnotes}
                type={"chapter_metadata.ms"}
                index={1}
                footnoteRefs={footnoteRefs}
                hadithId={chapter.id}
              >
                <QuranText
                  text={chapter.metadata_ms}
                  font="font-arabic-symbol"
                />
              </FootnoteText>
            </p>
          )}
          {lexicalState?.metadata_ar ? (
            <div className="order-3 sm:order-4 text-xl text-justify whitespace-pre-line font-arabic text-gray-600 leading-[1.8] select-none">
              <LexicalRenderer
                serializedState={lexicalState.metadata_ar}
                className="leading-relaxed"
                footnoteRefs={footnoteRefs}
                hadithId={chapter.id}
              />
            </div>
          ) : (
            <p
              lang="ar"
              dir="rtl"
              className="order-3 sm:order-4 text-xl text-justify whitespace-pre-line font-arabic text-gray-600 leading-[1.8] select-none"
            >
              <QuranText text={chapter.metadata_ar} />
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default ChapterRenderer;
