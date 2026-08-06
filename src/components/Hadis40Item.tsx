import type { Hadis40ListItem, Hadis40Source } from "@/lib/hadith40";


interface Hadis40ItemProps {
  item: Hadis40ListItem;
  showSectionHeader?: boolean;
  mode?: 'list' | 'individual'
  sources?: Hadis40Source[];
}

export default function Hadis40Item({
  item,
  showSectionHeader = true,
  mode,
  sources,
}: Hadis40ItemProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-0">
      <aside aria-hidden />

      <div className="w-full max-w-4xl border-x-1 relative border-gray-200/50 bg-white before:h-px before:content-[''] before:top-0 before:left-[50%] before:w-[100vw] before:absolute before:bg-gray-200/50 before:-translate-x-1/2">
        {showSectionHeader && (
          <div
            id={String(item.number)}
            className="flex items-baseline gap-4 px-4 sm:px-8 py-12 scroll-mt-24 before:bg-[size:10px_10px] after:bg-[size:10px_10px] before:border-r-1 before:border-gray-200/50 after:border-l-1 after:border-gray-200/50 relative before:absolute before:top-0 before:bottom-0 before:left-0 before:w-4 before:bg-[image:repeating-linear-gradient(315deg,transparent,transparent_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)] after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-4 after:bg-[repeating-linear-gradient(315deg,transparent,transparent_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)]"
          >
            <span className="font-mono text-xs text-royal-blue uppercase tracking-widest shrink-0">
              Hadis {item.number}
            </span>
            <h2 className="text-xl sm:text-2xl font-serif text-gray-900 leading-tight">
              {item.hadith_title.ms}
            </h2>
          </div>
        )}

        {item.content.map((cnt, i) => (
          <div key={i} className="px-4 sm:px-8 py-16 space-y-8 relative before:h-px before:content-[''] before:top-0 before:left-[50%] before:w-[100vw] before:absolute before:bg-gray-200/50 before:-translate-x-1/2 border-b border-gray-200/50">
            {item.narrators[i]?.ms && (
              <p className="text-sm text-gray-500 italic font-arabic-symbol">
                {item.narrators[i].ms}
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="order-2 lg:order-1 space-y-4">
                <p className="leading-relaxed text-base text-justify whitespace-pre-line font-arabic-symbol select-none">
                  {cnt.ms}
                </p>
                {item.narrated_by[i]?.ms && (
                  <p className="text-xs text-gray-400 text-right font-arabic-symbol">
                    {item.narrated_by[i].ms}
                  </p>
                )}
                {cnt.audio?.ms && (
                  <audio
                    controls
                    preload="none"
                    src={cnt.audio.ms}
                    className="w-full h-10"
                    aria-label={`Audio Melayu untuk Hadis ${item.number}`}
                  />
                )}
              </div>

              <div className="order-1 lg:order-2 space-y-4">
                <p
                  lang="ar"
                  dir="rtl"
                  className="text-xl text-justify whitespace-pre-line font-arabic leading-[1.8] select-none"
                >
                  {cnt.ar}
                </p>
                {item.narrated_by[i]?.ar && (
                  <p
                    lang="ar"
                    dir="rtl"
                    className="text-xs text-gray-400 font-arabic"
                  >
                    {item.narrated_by[i].ar}
                  </p>
                )}
                {cnt.audio?.ar && (
                  <audio
                    controls
                    preload="none"
                    src={cnt.audio.ar}
                    className="w-full h-10"
                    aria-label={`Audio Arab untuk Hadis ${item.number}`}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        {item.lesson.items.length > 0 && (
          <div className="relative border-b border-gray-200/50 py-12 px-6 sm:px-12">
            <div className="font-mono uppercase text-xs text-black absolute left-2 top-2">
              +
            </div>
            <div className="font-mono uppercase text-xs text-black absolute left-2 bottom-2">
              +
            </div>
            <div className="font-mono uppercase text-xs text-black absolute right-2 top-2">
              +
            </div>
            <div className="font-mono uppercase text-xs text-black absolute right-2 bottom-2">
              +
            </div>

            <p className="font-mono text-xs uppercase tracking-widest text-[#f80] mb-5">
              Pengajaran
            </p>
            <ul className="space-y-3">
              {item.lesson.items.map((l, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-base text-gray-800 font-arabic-symbol"
                >
                  <span
                    aria-hidden
                    className="text-royal-blue/70 mt-1.5 shrink-0 text-xs"
                  >
                    ◆
                  </span>
                  <span className="leading-relaxed select-none">{l.ms}</span>
                </li>
              ))}
            </ul>
            {item.lesson.audio?.ms && (
              <audio
                controls
                preload="none"
                src={item.lesson.audio.ms}
                className="mt-6 w-full h-10"
                aria-label={`Audio pengajaran untuk Hadis ${item.number}`}
              />
            )}
          </div>
        )}
        {sources && sources.length > 0 && (
          <div className="border-b border-gray-200/50 py-8 px-4 sm:px-8">
            <p className="font-mono text-xs uppercase tracking-widest  mb-1">
              [ Sumber dalam Kutub Sittah ]
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Baca hadis ini dalam koleksi sahih asalnya.
            </p>
            <ul className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <li key={s.hadith_id}>
                  <a
                    href={`/${s.book_slug}/${s.label}`}
                    
                    className="inline-flex items-center border border-gray-200/70 bg-gray-50 px-3 py-1.5 text-sm text-royal-blue hover:bg-royal-blue hover:text-white transition-colors"
                    aria-label={`Baca dalam ${s.book_title_ms} nombor ${s.label}`}
                  >
                    {s.book_title_ms} {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        { mode === 'list' && (
          <div className=" bg-white pb-10 py-3 px-4 sm:px-8 flex justify-end">
            <a
              href={`/hadis40/${item.number}`}
              
              className="font-mono text-[10px] uppercase tracking-widest text-royal-blue hover:underline"
              aria-label={`Baca halaman khusus Hadis ${item.number} Imam Nawawi: ${item.hadith_title.ms}`}
            >
              Baca halaman Hadis {item.number} →
            </a>
          </div>
        )}
      </div>

      <aside aria-hidden />
    </div>
  );
}
