import React from "react";
import type { MutableRefObject } from "react";
import { isEmpty } from "es-toolkit/compat";
import type { Footnote } from "@/lib/types/hadith";

interface FootnoteTextProps {
  children: React.ReactNode;
  footnotes: Footnote[];
  type: string;
  index: number;
  footnoteRefs: MutableRefObject<Record<string, HTMLElement | null>>;
  hadithId: string;
}

/**
 * FootnoteText Component
 *
 * PURPOSE: Inserts footnote reference markers (like [1], [2]) into hadith text at specific character positions.
 *
 * EXAMPLE FLOW with actual data:
 *
 * Given hadith text (content.ms):
 *   "27 – Abu al-Yaman menyampaikan kepada kami... kerana saya bimbang Allah akan mencampakkannya ke dalam neraka."
 *   (This is 1177 characters long)
 *
 * Given footnote:
 *   {
 *     ms: "Jika orang yang lemah imannya tidak dilayani dengan baik...",  // The footnote explanation text
 *     position: 1177,           // Insert marker at character position 1177 (after "neraka")
 *     number: 2,                // Display as [2]
 *     type: "content.ms",       // This footnote is for Malay content
 *     hadithIndex: 1            // This footnote belongs to hadith index 1
 *   }
 *
 * OUTPUT:
 *   The text will be rendered as:
 *   "27 – Abu al-Yaman... ke dalam neraka.<sup>[2]</sup>"
 *
 *   When user clicks [2], they can scroll to see the explanation:
 *   "Jika orang yang lemah imannya tidak dilayani dengan baik..."
 *
 * @param {React.ReactNode} children - The original text/component to insert footnotes into
 * @param {Array} footnotes - Array of footnote objects from database (with ms, position, number, type, hadithIndex)
 * @param {string} type - The content type to match (e.g., "content.ms", "content.ar", "content.en")
 * @param {number} index - The hadith index to match against footnote.hadithIndex
 * @param {React.MutableRefObject} footnoteRefs - Ref object to store footnote marker DOM elements for scrolling
 * @param {string} hadithId - Unique ID for this hadith, used for creating unique ref keys
 */
const FootnoteText = ({
  children,
  footnotes = [],
  type,
  index,
  footnoteRefs,
  hadithId,
}: FootnoteTextProps) => {
  // STEP 1: Early exit if no footnotes provided
  // Example: If footnotes array is [], return the hadith text as-is without any [1], [2] markers
  if (
    isEmpty(footnotes) ||
    (Array.isArray(footnotes) && footnotes.every(isEmpty))
  ) {
    return children;
  }

  // STEP 2: Extract the first child element from React children
  // Example: children might be <p>27 – Abu al-Yaman...</p>, we get that <p> element
  const childrenArray = React.Children.toArray(children);
  const originalChild = childrenArray[0];

  // STEP 3: Validate that we have a valid React element to work with
  // If not a valid element, return as-is
  if (!originalChild || !React.isValidElement(originalChild)) {
    return children;
  }

  // STEP 4: Extract the text content from the element
  // For custom components: uses the 'text' prop
  // For HTML elements: uses the 'children' prop
  // Example: originalText = "27 – Abu al-Yaman menyampaikan kepada kami... ke dalam neraka."
  const originalText =
    (originalChild.props as any)?.text || (originalChild.props as any)?.children || "";

  // STEP 5: Sort footnotes by position in ascending order
  // This ensures we process footnotes from beginning to end of the text
  // Example: If footnotes at [1177, 500, 800], after sorting: [500, 800, 1177]
  const sortedFootnotes = [...footnotes].sort(
    (a, b) => a.position - b.position,
  );

  // STEP 6: Filter footnotes to only include those matching this specific content type and hadith index
  // Example: type="content.ms" and index=1
  // Only keeps: {type: "content.ms", hadithIndex: 1, position: 1177, number: 2}
  // Filters out: {type: "content.ar", hadithIndex: 1} or {type: "content.ms", hadithIndex: 2}
  const filteredFootnotes = sortedFootnotes.filter(
    (footnote) => type === footnote.type && footnote.hadith_index === index,
  );

  // STEP 7: If no footnotes match this content after filtering, return original
  // Example: If we're rendering English text but only have Malay footnotes, return text as-is
  if (filteredFootnotes.length === 0) {
    return children;
  }

  // STEP 8: Determine if this is a custom component or standard HTML element
  // Custom components use 'text' prop, HTML elements use 'children' prop
  // This affects how we clone and update the element later
  const isCustomComponent = (originalChild.props as any)?.text !== undefined;

  // STEP 9: Create footnote marker elements (<sup>[2]</sup>) with refs for each filtered footnote
  // Example: For {position: 1177, number: 2}, creates:
  // {
  //   position: 1177,
  //   marker: <sup ref={...}>[2]</sup>,     // The visible [2] marker
  //   footnote: {ms: "Jika orang...", position: 1177, number: 2, ...}
  // }
  // The ref is stored in footnoteRefs.current["hadithId-2"] so we can scroll to it when user clicks
  const positions = filteredFootnotes.map((footnote) => ({
    position: footnote.position,
    marker: (
      <sup
        key={`footnote-${footnote.number}`}
        ref={(el) => {
          if (footnoteRefs.current && el) {
            const key = `${hadithId}-${footnote.number}`;
            footnoteRefs.current[key] = el;
          }
        }}
      >
        {/* Mobile: clickable link to scroll to footnote */}
        <a
          href={`#footnote-${hadithId}-${footnote.number}`}
          className="lg:hidden text-blue-600 hover:underline"
        >
          [{footnote.number}]
        </a>
        {/* Desktop: non-clickable marker */}
        <span className="hidden lg:inline">[{footnote.number}]</span>
      </sup>
    ),
    footnote,
  }));

  // STEP 10: Build text segments by slicing the original text at footnote positions
  // Example: Text "27 – Abu al-Yaman... neraka." (1177 chars) with footnote at position 1177
  // Creates segments:
  // [
  //   {text: "27 – Abu al-Yaman... neraka.", footnote: <sup>[2]</sup>, key: "segment-0"}
  // ]
  // If there were a footnote at position 500:
  // [
  //   {text: "27 – Abu al-Yaman... (chars 0-500)", footnote: <sup>[1]</sup>, key: "segment-0"},
  //   {text: "... neraka. (chars 500-1177)", footnote: <sup>[2]</sup>, key: "segment-1"}
  // ]
  type Segment = { text: string; footnote: React.ReactNode | null; key: string };
  const segments: Segment[] = [];
  let lastPosition = 0;

  positions.forEach(({ position, marker }, posIndex) => {
    // Slice text from last position to current footnote position
    // Example: originalText.slice(0, 1177) = "27 – Abu al-Yaman... neraka."
    const textSegment = originalText.slice(lastPosition, position);
    segments.push({
      text: textSegment,
      footnote: marker,
      key: `segment-${posIndex}`,
    });
    lastPosition = position;
  });

  // STEP 11: Add any remaining text after the last footnote
  // Example: If text is 1200 chars and last footnote is at 1177
  // Adds segment: {text: "Yunus, Shalih..." (chars 1177-1200), footnote: null}
  if (lastPosition < originalText.length) {
    const remainingText = originalText.slice(lastPosition);
    segments.push({
      text: remainingText,
      footnote: null,
      key: "segment-final",
    });
  }

  // STEP 12: SPECIAL CASE - If all footnotes are at the very end (or only one segment exists)
  // This means the footnote markers can simply be appended to the text element
  // Example: Our case with position 1177 at the end of 1177-char text
  // Instead of splitting, we just render: <p>27 – Abu al-Yaman... neraka.<sup>[2]</sup></p>
  if (
    segments.length === 1 ||
    (segments.length > 1 &&
      segments.slice(0, -1).every((seg) => seg.text === ""))
  ) {
    const lastSegment = segments[segments.length - 1];
    // Extract all footnote markers from segments
    // Example: [<sup>[2]</sup>]
    const allFootnotes = segments
      .filter((seg) => seg.footnote)
      .map((seg) => seg.footnote);

    // Combine text with footnotes
    // Example: ["27 – Abu al-Yaman... neraka.", <sup>[2]</sup>]
    const combinedContent = [lastSegment.text, ...allFootnotes];

    if (isCustomComponent) {
      // For custom components, render the component with original text,
      // then append footnote markers separately
      const componentElement = React.cloneElement(originalChild, {
        ...(originalChild.props as any),
        text: originalText, // Just the text string, no markers
      });

      // If footnotes exist, render component + markers separately
      // Example: <><CustomComponent text="..." /><sup>[2]</sup></>
      if (allFootnotes.length > 0) {
        return (
          <>
            {componentElement}
            {allFootnotes}
          </>
        );
      }

      return componentElement;
    } else {
      // For HTML elements, clone with text + footnote markers as children
      // Example: <p>27 – Abu al-Yaman... neraka.<sup>[2]</sup></p>
      return React.cloneElement(originalChild, {
        ...(originalChild.props as any),
        children: combinedContent,
      });
    }
  }

  // STEP 13: GENERAL CASE - Multiple segments with footnotes in the middle of text
  // Example: Text "Hello world foo bar" with footnotes at positions 5 and 11
  // Creates: [<p>Hello</p>, <sup>[1]</sup>, <p> world</p>, <sup>[2]</sup>, <p> foo bar</p>]
  //
  // For our hadith example, if there were footnotes at both position 500 and 1177:
  // [
  //   <p>27 – Abu al-Yaman... (chars 0-500)</p>,
  //   <sup>[1]</sup>,
  //   <p>... neraka. (chars 500-1177)</p>,
  //   <sup>[2]</sup>
  // ]
  const result: React.ReactNode[] = [];

  segments.forEach(({ text, footnote, key }) => {
    // Add text segment if it exists
    if (text) {
      if (isCustomComponent) {
        // Clone custom component with text prop
        result.push(
          React.cloneElement(originalChild, {
            key,
            ...(originalChild.props as any),
            text: text,
          }),
        );
      } else {
        // Clone HTML element with children prop
        result.push(
          React.cloneElement(originalChild, {
            key,
            ...(originalChild.props as any),
            children: text,
          }),
        );
      }
    }

    // Add footnote marker if it exists
    if (footnote) {
      result.push(footnote);
    }
  });

  // STEP 14: Return the array of text segments with embedded footnote markers
  // React will render this array as multiple elements side by side
  return result;
};

export default FootnoteText;