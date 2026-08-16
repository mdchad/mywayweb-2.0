import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { KUTUB_SITTAH } from "@/components/header";
import posthog from "posthog-js";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// cmdk sorts items (and groups) by descending score. Action items always
// return 1 so they pin to the top; other items are capped below 1 so they
// can never outrank actions even on an exact match.
const customFilter = (value: string, search: string): number => {
  if (value.startsWith("action:")) return 1;
  const s = search.toLowerCase().trim();
  if (!s) return 0.5;
  return value.toLowerCase().includes(s) ? 0.5 : 0;
};

export function SearchCommandDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Reset the input every time the dialog re-opens.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const submit = () => {
    const term = query.trim();
    if (!term) return;
    posthog.capture("search_performed", { search_term: term, mode: "hybrid" });
    onOpenChange(false);
    navigate({
      to: "/search",
      search: { term, page: 1, mode: "hybrid" as const },
    });
  };

  const goToBook = (slug: string) => {
    onOpenChange(false);
    navigate({ to: "/book/$slug", params: { slug } });
  };

  const hasQuery = query.trim().length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Carian"
      description="Cari hadis, buku, atau jilid"
      commandProps={{ filter: customFilter }}
    >
      <CommandInput
        placeholder="Cari hadis, buku, atau jilid..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="h-[400px] max-h-[400px]">
          <CommandEmpty>Tiada hasil.</CommandEmpty>

          <CommandGroup heading="Aksi">
            <CommandItem
              value="action:search"
              onSelect={submit}
              disabled={!hasQuery}
              className="flex items-center gap-3"
            >
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">
                {hasQuery ? (
                  <>
                    Cari <span className="font-semibold">"{query}"</span>
                  </>
                ) : (
                  "Cari hadis"
                )}
              </span>
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Buku">
            {KUTUB_SITTAH.map((book) => (
              <CommandItem
                key={book.slug}
                value={`${book.title} ${book.slug} ${book.arabic}`}
                onSelect={() => goToBook(book.slug)}
                className="flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{book.title}</div>
                </div>
                <span className="font-book text-sm text-muted-foreground shrink-0">
                  {book.arabic}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
