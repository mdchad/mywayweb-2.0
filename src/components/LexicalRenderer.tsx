import React from "react";
import { camelCase } from "es-toolkit";

interface LexicalRendererProps {
  serializedState: any;
  className?: string;
  lang?: string;
  dir?: string;
  footnoteRefs?: React.RefObject<any>;
  hadithId?: string;
}

// JSX Renderer for Lexical serialized state
const renderSerializedToJSX = (serializedState: any, footnoteRefs?: React.RefObject<any>, hadithId?: string, forceDir?: "ltr" | "rtl") => {
  if (!serializedState?.root) return null;
  return renderNode(serializedState.root, Math.random(), footnoteRefs, hadithId, forceDir);
};

const renderNode = (node: any, key: React.Key = Math.random(), footnoteRefs?: React.RefObject<any>, hadithId?: string, forceDir?: "ltr" | "rtl") => {
  // Handle root node
  if (node.type === 'root') {
    return (
      <div key={key}>
        {node.children?.map((child: any, index: number) => renderNode(child, index, footnoteRefs, hadithId, forceDir))}
      </div>
    );
  }

  // Handle text nodes
  if (node.type === 'text') {
    let content: React.ReactNode = node.text || '';
    let pStyle: any = {};
    
    if (node.style) {
      node.style.split(';').forEach((style: string) => {
        const [property, value] = style.split(':');
        if (property && value) {
          pStyle[camelCase(property.trim()) as keyof React.CSSProperties] = value.trim();
        }
      });
    }

    // Apply formatting based on format bitmask
    if (node.format) {
      if (node.format & 1) content = <strong>{content}</strong>; // bold
      if (node.format & 2) content = <em>{content}</em>; // italic
      if (node.format & 4) content = <s>{content}</s>; // strikethrough
      if (node.format & 8) content = <u>{content}</u>; // underline
      if (node.format & 16) content = <code>{content}</code>; // code
      if (node.format & 32) content = <sub>{content}</sub>; // subscript
      if (node.format & 64) {
        // Handle superscript with potential footnote refs
        // IMPORTANT: To properly set footnoteRefs.current, the superscript text MUST:
        // 1. Be formatted as superscript in the Lexical editor (format & 64)
        // 2. Contain square brackets with the footnote number, e.g., "[2]" or "[1]"
        // 3. Have footnoteRefs and hadithId props passed to <LexicalRenderer>
        // Example: <sup>[2]</sup> will create key "hadithId-2" in footnoteRefs.current
        // Without the bracket notation, the ref won't be stored and scroll-to-footnote won't work
        const textContent = typeof content === 'string' ? content : node.text || '';
        const footnoteMatch = textContent.match(/\[(\d+)\]/);

        if (footnoteMatch && footnoteRefs?.current && hadithId) {
          const footnoteNumber = footnoteMatch[1];
          const refKey = `${hadithId}-${footnoteNumber}`;
          const footnoteId = `footnote-${hadithId}-${footnoteNumber}`;

          content = (
            <sup
              ref={(el) => {
                if (el) {
                  footnoteRefs.current[refKey] = el;
                }
              }}
            >
              {/* Mobile: clickable link to footnote */}
              <a
                href={`#${footnoteId}`}
                className="lg:hidden text-blue-600 hover:underline"
              >
                {content}
              </a>
              {/* Desktop: non-clickable marker (sidenotes handle display) */}
              <span className="hidden lg:inline">{content}</span>
            </sup>
          );
        } else {
          content = <sup>{content}</sup>; // regular superscript
        }
      }
      if (node.format & 128) { // highlight
        content = <mark>{content}</mark>;
      }
    }

    return <span key={key} style={pStyle}>{content}</span>;
  }

  // Handle element nodes
  const children = node.children?.map((child: any, index: number) =>
    renderNode(child, `${key}-${index}`, footnoteRefs, hadithId, forceDir)
  ) || [];

  switch (node.type) {
    case 'paragraph':
      const pStyle: React.CSSProperties = {};
      if (node.format && node.format !== 'left') {
        pStyle.textAlign = node.format as React.CSSProperties['textAlign'];
      }
      if (node.indent && node.indent > 0) {
        pStyle.marginLeft = `${node.indent * 20}px`;
      }
      // Paragraph direction: caller's forceDir wins (the language defines
      // the base direction; embedded Arabic terms inside an ms paragraph
      // should not flip the whole paragraph to RTL). When caller doesn't
      // force, fall back to whatever Lexical stored on the node.
      const paraDir = forceDir ?? node.direction;
      if (paraDir) {
        pStyle.direction = paraDir as React.CSSProperties["direction"];
      }

      return (
        <p key={key} style={pStyle} className="mb-4">
          {children}
        </p>
      );

    case 'heading':
      const headingLevel = Math.min(Math.max(node.tag || 1, 1), 6);
      const HeadingTag = `h${headingLevel}`;
      return React.createElement(
        HeadingTag,
        { key, className: 'font-bold mb-4' },
        children
      );

    case 'table':
      return (
        <table key={key} className="border-collapse border border-gray-300 w-full mb-4">
          <tbody>{children}</tbody>
        </table>
      );

    case 'tablerow':
      return <tr key={key}>{children}</tr>;

    case 'tablecell':
      return (
        <td key={key} className="border border-gray-300 p-2">
          {children}
        </td>
      );

    case 'code':
      return (
        <pre key={key} className="bg-gray-100 p-4 rounded overflow-x-auto mb-4">
          <code className={node.language ? `language-${node.language}` : ''}>
            {node.children?.[0]?.text || children}
          </code>
        </pre>
      );

    case 'quote':
      return (
        <blockquote key={key} className="border-l-4 border-gray-300 pl-4 italic my-4">
          {children}
        </blockquote>
      );

    case 'list':
      const ListTag = node.listType === 'number' ? 'ol' : 'ul';
      const listClassName = node.listType === 'number' ? 'list-decimal list-inside mb-4' : 'list-disc list-inside mb-4';
      return React.createElement(
        ListTag,
        { key, className: listClassName },
        children
      );

    case 'listitem':
      return <li key={key}>{children}</li>;

    case 'hadith-number':
      return (
        <div key={key} className="hadith-number font-bold text-lg mb-2">
          {node.number || children}
        </div>
      );

    case 'prophet-quote':
      return (
        <blockquote key={key} className="prophet-quote border-l-4 border-green-500 pl-4 bg-green-50 my-4">
          {children}
        </blockquote>
      );

    case 'narrator-chain':
      return (
        <div key={key} className="narrator-chain text-gray-700 italic mb-3">
          {children}
        </div>
      );

    case 'columns':
      const colCount = node.columnCount || 2;
      return (
        <div key={key} className={`grid grid-cols-${colCount} gap-4 mb-4`}>
          {children}
        </div>
      );

    case 'column':
      return (
        <div key={key} className="column">
          {children}
        </div>
      );

    case 'linebreak':
      return <br key={key} />;

    default:
      return (
        <div key={key} className="unknown-block">
          {children}
        </div>
      );
  }
};

export default function LexicalRenderer({
  serializedState,
  className = "",
  lang,
  dir,
  footnoteRefs,
  hadithId
}: LexicalRendererProps) {
  if (!serializedState) {
    return null;
  }

  // When the caller explicitly sets `dir`, also force it on inner paragraphs
  // so stored per-paragraph directions (often auto-RTL because Lexical saw
  // Arabic content inline) don't override the language's base direction.
  const forceDir = dir === "rtl" || dir === "ltr" ? dir : undefined;

  return (
    <div className={className} lang={lang} dir={dir}>
      {renderSerializedToJSX(serializedState, footnoteRefs, hadithId, forceDir)}
    </div>
  );
}

// Export the render functions for backward compatibility
export { renderSerializedToJSX, renderNode };