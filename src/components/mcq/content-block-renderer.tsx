'use client';

import dynamic from 'next/dynamic';
import type { ContentBlock } from '@/types';

// Dynamically import KaTeX to avoid SSR issues
const InlineMath = dynamic(
  () => import('react-katex').then((m) => m.InlineMath),
  { ssr: false, loading: () => <span className="opacity-50">…</span> }
);

const BlockMath = dynamic(
  () => import('react-katex').then((m) => m.BlockMath),
  { ssr: false, loading: () => <div className="opacity-50 py-2">…</div> }
);

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  className?: string;
}

function renderTextWithMath(text: string): React.ReactNode[] {
  // Parse $$...$$ block math and $...$ inline math from TEXT blocks
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Block math $$...$$
    const blockMatch = remaining.match(/\$\$([\s\S]+?)\$\$/);
    if (blockMatch) {
      const idx = remaining.indexOf(blockMatch[0]);
      if (idx > 0) {
        // Also parse \ce{...} in plain text parts
        parts.push(...parseChemistry(remaining.slice(0, idx), key));
        key += 100;
      }
      parts.push(
        <BlockMath key={key++} math={blockMatch[1]} errorColor="#e11d48" />
      );
      remaining = remaining.slice(idx + blockMatch[0].length);
      continue;
    }

    // Inline math $...$
    const inlineMatch = remaining.match(/\$(.+?)\$/);
    if (inlineMatch) {
      const idx = remaining.indexOf(inlineMatch[0]);
      if (idx > 0) {
        parts.push(...parseChemistry(remaining.slice(0, idx), key));
        key += 100;
      }
      parts.push(
        <InlineMath key={key++} math={inlineMatch[1]} errorColor="#e11d48" />
      );
      remaining = remaining.slice(idx + inlineMatch[0].length);
      continue;
    }

    // No more math — parse remaining for chemistry
    parts.push(...parseChemistry(remaining, key));
    break;
  }

  return parts;
}

function parseChemistry(text: string, baseKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = baseKey;

  while (remaining.length > 0) {
    const ceMatch = remaining.match(/\\ce\{([^}]+)\}/);
    if (ceMatch) {
      const idx = remaining.indexOf(ceMatch[0]);
      if (idx > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>);
      }
      // Render chemistry as inline math with mhchem
      parts.push(
        <InlineMath
          key={key++}
          math={`\\ce{${ceMatch[1]}}`}
          errorColor="#e11d48"
        />
      );
      remaining = remaining.slice(idx + ceMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return parts;
}

export function ContentBlockRenderer({ blocks, className }: ContentBlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={className}>
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'TEXT':
      return (
        <span className="leading-relaxed whitespace-pre-wrap">
          {renderTextWithMath(block.content)}
        </span>
      );

    case 'MATH':
      // Pure math block — treat content as block math
      return (
        <div className="my-2">
          <BlockMath math={block.content} errorColor="#e11d48" />
        </div>
      );

    case 'CHEMISTRY':
      return (
        <div className="my-1">
          <InlineMath math={`\\ce{${block.content}}`} errorColor="#e11d48" />
        </div>
      );

    case 'IMAGE':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.content}
          alt={block.altText ?? 'Question image'}
          className="my-3 max-h-64 max-w-full rounded-lg border border-border object-contain"
          loading="lazy"
        />
      );

    case 'AUDIO':
      return (
        <audio
          src={block.content}
          controls
          className="my-3 w-full rounded-lg"
          aria-label={block.altText ?? 'Audio content'}
        />
      );

    case 'VIDEO':
      return (
        <video
          src={block.content}
          controls
          className="my-3 max-h-64 w-full rounded-lg"
          aria-label={block.altText ?? 'Video content'}
        />
      );

    default:
      return null;
  }
}
