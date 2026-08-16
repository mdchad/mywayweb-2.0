import { Input } from "@/components/ui/input";
import { useFuzzySearchList } from "@nozbe/microfuzz/react";
import { Search } from "lucide-react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import posthog from "posthog-js";
import type { Volume } from "@/lib/types/hadith";

interface VolumeContainerProps {
  volumes: Volume[];
  slug: string;
}

const bookRoute = getRouteApi("/_main/book/$slug/");

function VolumeContainer({ volumes, slug }: VolumeContainerProps) {
  // Filter state lives in the URL (?q=...) so it survives navigation away
  // and back via the browser's back button (was nuqs in the Next.js app).
  const { q: rawQ = "" } = bookRoute.useSearch();
  const q = String(rawQ);
  const navigate = useNavigate();
  const setQ = (value: string | null) =>
    navigate({
      to: ".",
      search: (prev: { q?: string | number }) => ({
        ...prev,
        // Write digit-only filters as numbers so the URL stays ?q=500
        // (a numeric string would be JSON-quoted to %22500%22).
        q: value ? (/^\d+$/.test(value) ? Number(value) : value) : undefined,
      }),
      replace: true,
      // nuqs never scrolled on URL updates; router navigations reset scroll
      // to top by default, which yanks the page while typing in the filter.
      resetScroll: false,
    });

  const parsedNumber = parseInt(q, 10);
  const queryNumber = !isNaN(parsedNumber) && parsedNumber > 0 ? parsedNumber : 0;
  const queryText = queryNumber > 0 ? "" : q;

  const numberFilteredList = queryNumber > 0
    ? volumes.filter(
        (v) =>
          (v.hadith_first != null &&
            v.hadith_last != null &&
            queryNumber >= v.hadith_first &&
            queryNumber <= v.hadith_last) ||
          v.extra_numbers?.includes(queryNumber),
      )
    : volumes;

  const filteredList = useFuzzySearchList({
    list: numberFilteredList,
    queryText,
    getText: (item) => [item.title_ms],
    mapResultItem: ({ item }) => ({ ...item }),
  });

  return (
    <div className="py-16 px-4 lg:px-40 grid gap-6 h-full w-full bg-[radial-gradient(circle,#eaeaea_1px,transparent_1px)] bg-[size:10px_10px]">
      <div className="relative h-full mb-6">
        <Search className="absolute left-2.5 top-4 h-4 w-4 text-muted-foreground stroke-gray-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value || null)}
          className="pl-8 bg-white rounded-none border-gray-400 h-full placeholder:text-gray-400"
          placeholder="Cari kitab atau nombor hadis"
        />
      </div>
      <div className="">
        {!!filteredList.length ? (
          filteredList.map((vol) => {
            return (
              <div className="relative group" key={vol.id}>
                <div className="absolute left-0 top-0 h-full w-full bg-[size:10px_10px] bg-[image:repeating-linear-gradient(315deg,white,white_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)] border border-b-0 group-last:border-b border-[#d6d6d6]"></div>
                <a
                  key={vol.id}
                  href={`/book/${slug}/${vol.slug}${
                    queryNumber
                      ? (() => {
                          const variant = vol.variant_anchors?.[queryNumber];
                          return `#hadith-${queryNumber}${variant ? `-${variant}` : ""}`;
                        })()
                      : ""
                  }`}
                  onClick={() => {
                    posthog.capture('volume_viewed', {
                      volume_id: vol.id,
                      volume_name: vol.slug,
                      volume_title: vol.title_ms,
                      volume_number: vol.number,
                      book_slug: slug,
                      hadith_range_first: vol.hadith_first,
                      hadith_range_last: vol.hadith_last,
                    });
                  }}
                >
                  <div
                    key={vol.id}
                    className="hover:-translate-x-1.5 hover:-translate-y-1.5 transition-transform duration-200 relative w-full grid md:grid-cols-[1fr_1fr_150px] gap-10 space-x-4 px-10 py-8 bg-white hover:border-b border border-b-0 group-first:border-t group-last:border-b border-[#d6d6d6] cursor-pointer"
                  >
                    <div className="absolute top-0 left-0 bg-gray-200/50 p-1 px-2">{vol.number}</div>
                    <div className="space-y-1 flex flex-col items-start text-left max-w-xs">
                      <h2 className="text-xl leading-5 font-sans">
                        {vol.title_ms}
                      </h2>
                      <p className="text-xs text-gray-500 font-sans">
                        {vol.transliteration_ms?.trim().toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p lang="ar" className="text-2xl text-right font-arabic">
                        {vol.title_ar}
                      </p>
                      <div className="md:hidden grid grid-cols-3 gap-2 text-center mt-4 w-28">
                        <p className="text-sm text-[#31498B] font-sans">
                          {vol.hadith_first}
                        </p>
                        <p className="text-sm text-[#31498B] font-sans transition-transform duration-300 ease-in-out group-hover:translate-x-1">
                          {"->"}
                        </p>
                        <p className="text-sm text-[#31498B] font-sans">
                          {vol.hadith_last}
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:grid grid-cols-3 gap-2 text-center">
                      <p className="text-sm text-[#31498B] font-sans">
                        {vol.hadith_first}
                      </p>
                      <p className="text-sm text-[#31498B] font-sans transition-transform duration-300 ease-in-out group-hover:translate-x-1">
                        {"->"}
                      </p>
                      <p className="text-sm text-[#31498B] font-sans">
                        {vol.hadith_last}
                      </p>
                    </div>
                    <div className="absolute flex gap-2 bottom-0 right-0 bg-royal-blue px-2 py-1 text-white font-mono text-xs">↗</div>
                  </div>
                </a>
              </div>
            );
          })
        ) : (
          <div className="w-full p-20 bg-white text-center border">
            <p className="text-2xl ">Kitab tidak dijumpai</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VolumeContainer;
