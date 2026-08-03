import { MoveUpRightIcon } from "lucide-react";
import QuranText from "@/components/QuranText";
import { cn } from "@/lib/utils";
import type { HadithPreview } from "@/lib/types/hadith";

// Data comes from the home route loader (KV `todayHadithPreview`), unlike the
// Next.js version which read KV directly as a server component.
function TodayCard({ data }: { data: HadithPreview | null }) {
  // Defensive: skip render if KV holds a legacy shape (pre-migration) or
  // anything missing the nested book/volume objects.
  if (!data?.book?.slug || !data?.volume?.slug) return null;

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 h-full w-full bg-[size:10px_10px] bg-[image:repeating-linear-gradient(315deg,white,white_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)] border border-[#d6d6d6]"></div>
      <a href={`/${data.book.slug}/${data.label}`}>
        <div
          className={cn(
            "group relative overflow-hidden",
            "hover:-translate-x-1.5 hover:-translate-y-1.5 transition-transform duration-200",
            "bg-white grid items-center border border-[#d6d6d6] lg:p-20 p-12",
          )}
        >
          <h2 className="font-semibold text-2xl">Hadis Hari Ini</h2>
          <p className="capitalize font-mono font-light text-[#f80] text-xs mb-8">
            [ {data.book.title_ms} / {data.volume.title_ms.toLowerCase()} ]
          </p>
          <p
            className="mb-4 text-xl line-clamp-5 font-arabic leading-relaxed"
            lang="ar"
            dir="rtl"
          >
            <QuranText text={data.content[0]?.ar ?? ""} />
          </p>
          <p className="font-arabic-symbol line-clamp-5 mt-4">
            <QuranText text={data.content[0]?.ms ?? ""} font="font-arabic-symbol" />
          </p>
          <div className="absolute flex gap-2 bottom-0 right-0 bg-black p-2 text-white font-mono text-[10px] items-center">
            BACA LEBIH<MoveUpRightIcon size={12} />
          </div>
        </div>
      </a>
    </div>
  );
}

export default TodayCard;
