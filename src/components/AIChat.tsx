// TODO(port): placeholder until the chat feature port. The real AIChat
// (components/AIChat.tsx in myHadeethWeb) needs the ai-elements suite and the
// /api/chat streaming backend; both land together with the /chat page port.
// Props mirror the original so HadithRenderer's call site stays unchanged.
import type { HadithWithFootnotes } from "@/lib/types/hadith";

interface AIChatProps {
  hadith: HadithWithFootnotes;
}

function AIChat(_props: AIChatProps) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center p-8 text-center">
      <p className="text-sm text-muted-foreground font-mono">
        Tanya AI akan tersedia tidak lama lagi.
      </p>
    </div>
  );
}

export default AIChat;
