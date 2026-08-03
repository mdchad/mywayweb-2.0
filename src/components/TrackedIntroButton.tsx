import { Button } from "@/components/ui/button";
import posthog from "posthog-js";

export function TrackedIntroButton() {
  const handleClick = () => {
    // PostHog: Capture introduction PDF click event
    posthog.capture('introduction_pdf_clicked', {
      pdf_url: '/intro-malay.pdf',
    });
  };

  return (
    <a
      href="/intro-malay.pdf"
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
    >
      <Button className="mt-16 bg-[#f80] rounded-none cursor-pointer hover:bg-[#f80]/90">
        Baca Pengenalan
      </Button>
    </a>
  );
}
