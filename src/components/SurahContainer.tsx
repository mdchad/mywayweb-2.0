import QuranText from "@/components/QuranText";

interface SurahContainerProps {
  surahs?: any[];
  hadith: { number: number };
}

function SurahContainer({ surahs = [], hadith }: SurahContainerProps) {
  let surahData =
    surahs.filter((surah) => surah.hadith_number === hadith.number) || [];

  if (surahData.length > 0) {
    return surahData.map((val) => (
      <div
        className="relative before:h-px before:content-[''] before:top-0 before:left-[50%] before:w-[100vw] before:absolute before:bg-gray-200/50 before:-translate-x-1/2 after:h-px after:content-[''] after:bottom-0 after:left-[50%] after:w-[100vw] after:absolute after:bg-gray-200/50 after:-translate-x-1/2"
        key={val}
      >
        <div className="mt-10 bg-white flex flex-col items-center  p-6">
          <p className="font-surah text-6xl" dir="rtl">
            <span>{val.number.toString().padStart(3, "0")}</span>
            <span>{"surah".toString().padStart(3, "0")}</span>
          </p>
          <p className="text-lg font-sans">{val.title_ms}</p>
          {!!val.content?.[0]?.ms &&
            val.content.map((cnt: any, i: number) => {
              return (
                <div key={i} className="flex flex-col gap-12 mt-16">
                  <p
                    className="text-xl text-justify whitespace-pre-line font-arabic text-gray-600"
                    dir="rtl"
                  >
                    <QuranText text={cnt?.ar} />
                  </p>
                  <p className="text-base text-justify whitespace-pre-line font-arabic-symbol text-gray-600">
                    <QuranText text={cnt?.ms} font="font-arabic-symbol" />
                  </p>
                </div>
              );
            })}
        </div>
      </div>
    ));
  }
}

export default SurahContainer;