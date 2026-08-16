import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchCommandDialog } from "@/components/SearchCommandDialog";

function SearchBar() {
  const [open, setOpen] = useState(false);
  // Detect platform only after mount so the first client render matches the
  // server (which has no navigator), avoiding a hydration mismatch.
  const [isMac, setIsMac] = useState(false);

  // Cmd+K / Ctrl+K toggles the command dialog from anywhere.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  return (
    <div className="flex w-full h-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka carian"
        className="flex h-full w-full items-center gap-2 rounded-none border border-gray-400 bg-white px-3 text-sm text-muted-foreground transition-colors hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-royal-blue sm:w-[300px] md:w-[200px] lg:w-[300px]"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">Carian</span>
        <kbd className="ml-auto hidden shrink-0 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">{isMac ? "⌘" : "Ctrl"}</span>K
        </kbd>
      </button>
      <SearchCommandDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

export default SearchBar;
