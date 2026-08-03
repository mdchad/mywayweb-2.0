import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import posthog from "posthog-js";

interface CardProps {
  path: string;
  title: string;
  description: string;
  gradient?: boolean;
}

// NOTE(port): links are plain <a> until the target routes (/hadis40, /books,
// /chat) are ported; switch to typed <Link> as each route lands.
export function BookCard({ path, title, description }: CardProps) {
  const handleClick = () => {
    // PostHog: Capture book/section selection event
    posthog.capture('book_selected', {
      book_title: title,
      book_path: path,
    });
  };

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 h-full w-full bg-[size:10px_10px] bg-[image:repeating-linear-gradient(315deg,white,white_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)] border border-[#d6d6d6]"></div>
      <a href={path} onClick={handleClick}>
        <div
          className={cn(
            "group relative overflow-hidden",
            // light styles
            "hover:-translate-x-1.5 hover:-translate-y-1.5 transition-transform duration-200",
            "bg-white grid text-center items-end border border-[#d6d6d6] lg:p-20 p-8 h-full",
          )}
        >
            <h2 className="text-2xl font-semibold mb-2">{title}</h2>
            <p className="text-sm font-sans font-light">{description}</p>
            <Button className="mt-10 rounded-none font-mono text-xs mx-auto cursor-pointer">LIHAT</Button>
        </div>
      </a>
    </div>
  );
}


export function AICard({ path, title, description }: CardProps) {
  const handleClick = () => {
    // PostHog: Capture book/section selection event
    posthog.capture('ai-chat_selected', {
      book_path: path,
    });
  };

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 h-full w-full bg-[size:10px_10px] bg-[image:repeating-linear-gradient(315deg,white,white_6px,rgba(59,130,246,0.6)_5px,rgba(59,130,246,0.6)_7px)] border border-[#d6d6d6]"></div>
      <a href={path} onClick={handleClick}>
        <div
          className={cn(
            "pattern-dots-sm",
            "group relative overflow-hidden",
            // light styles
            "hover:-translate-x-1.5 hover:-translate-y-1.5 transition-transform duration-200",
            "bg-white grid text-center items-end border border-[#d6d6d6] lg:p-12 p-8 h-full",
          )}
        >
          <div className="bg-white lg:p-8 p-4">
            <h2 className="text-2xl font-geist-sans font-semibold mb-2 text-[#f80]">{title}</h2>
            <p className="text-sm font-sans font-light">{description}</p>
            <Button className="mt-10 rounded-none font-mono text-xs mx-auto cursor-pointer bg-royal-blue hover:bg-royal-blue/90">GUNAKAN</Button>
          </div>
        </div>
      </a>
    </div>
  );
}
