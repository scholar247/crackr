'use client';

import { useState, useMemo, isValidElement, type ComponentPropsWithoutRef, type ReactNode, type ComponentType } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import { Info, AlertTriangle, Lightbulb, OctagonAlert, Check } from 'lucide-react';
import type { CalloutVariant } from '@/components/editor/extensions/callout';
import { slugify } from '@/lib/utils';

const LANG_DISPLAY: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  go: 'Go',
  rust: 'Rust',
  sql: 'SQL',
  bash: 'Bash',
  sh: 'Shell',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  yaml: 'YAML',
  xml: 'XML',
  kotlin: 'Kotlin',
  swift: 'Swift',
  cs: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  scala: 'Scala',
  r: 'R',
};

const CALLOUT_META: Record<CalloutVariant, { icon: ComponentType<{ className?: string }>; label: string }> = {
  info: { icon: Info, label: 'Info' },
  warning: { icon: AlertTriangle, label: 'Warning' },
  tip: { icon: Lightbulb, label: 'Tip' },
  danger: { icon: OctagonAlert, label: 'Danger' },
};

/** Converts remark-directive's `:::info ... :::` containers into styled callout divs. */
function remarkCallouts() {
  return (tree: Parameters<typeof visit>[0]) => {
    visit(tree, (node) => {
      const directive = node as { type: string; name?: string; data?: Record<string, unknown> };
      if (directive.type !== 'containerDirective') return;
      const variant = directive.name as CalloutVariant;
      if (!(variant in CALLOUT_META)) return;
      directive.data = {
        ...directive.data,
        hName: 'div',
        hProperties: { className: ['callout', `callout-${variant}`], 'data-callout': variant },
      };
    });
  };
}

function textFromChildren(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join('');
  if (isValidElement<{ children?: ReactNode }>(children)) return textFromChildren(children.props.children);
  return '';
}

function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false);
  const codeEl = Array.isArray(children) ? children[0] : children;
  const codeClassName = isValidElement<{ className?: string }>(codeEl) ? codeEl.props.className : undefined;
  const langKey = codeClassName?.match(/language-(\S+)/)?.[1] ?? '';
  const langLabel = LANG_DISPLAY[langKey] ?? (langKey ? langKey.toUpperCase() : '');
  const codeText = textFromChildren(children);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — button silently stays as-is */
    }
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-toolbar">
        {langLabel && <span className="code-lang">{langLabel}</span>}
        <button type="button" className={copied ? 'copy-btn copied' : 'copy-btn'} onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="inline h-3 w-3 -mt-0.5 mr-1" />
              Copied!
            </>
          ) : (
            'Copy'
          )}
        </button>
      </div>
      <pre {...props}>{children}</pre>
    </div>
  );
}

function TableWrapper({ children, ...props }: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="table-wrapper">
      <table {...props}>{children}</table>
    </div>
  );
}

function CalloutBlock({ children, ...props }: ComponentPropsWithoutRef<'div'> & { 'data-callout'?: string }) {
  const variant = (props['data-callout'] as CalloutVariant | undefined) ?? 'info';
  const meta = CALLOUT_META[variant] ?? CALLOUT_META.info;
  const Icon = meta.icon;
  return (
    <div className={`callout callout-${variant}`} data-callout={variant}>
      <Icon className="callout-icon" aria-hidden="true" />
      <div className="callout-body">{children}</div>
    </div>
  );
}

function Img({ alt, ...props }: ComponentPropsWithoutRef<'img'>) {
  // eslint-disable-next-line @next/next/no-img-element -- arbitrary pasted URLs, not project-local assets
  return <img loading="lazy" alt={alt ?? ''} {...props} />;
}

const staticComponents: Components = {
  pre: CodeBlock,
  table: TableWrapper,
  div: CalloutBlock,
  img: Img,
};

/**
 * `seenIds` is shared across all three heading levels for one render pass
 * so ids agree on document order — matches `src/lib/toc.ts`'s
 * `extractHeadings` slug+dedup algorithm exactly, so the table of contents
 * (parsed from raw Markdown) and these anchors (from rendered nodes) land
 * on identical ids for the same document.
 */
function makeHeadingComponent(Tag: 'h2' | 'h3' | 'h4', seenIds: Map<string, number>) {
  return function Heading({ children, ...props }: ComponentPropsWithoutRef<'h2'>) {
    const text = textFromChildren(children);
    let id = slugify(text) || 'section';
    const count = seenIds.get(id) ?? 0;
    seenIds.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;
    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };
}

export function BlogContent({ content }: { content: string }) {
  const components = useMemo<Components>(() => {
    const seenIds = new Map<string, number>();
    return {
      ...staticComponents,
      h2: makeHeadingComponent('h2', seenIds),
      h3: makeHeadingComponent('h3', seenIds),
      h4: makeHeadingComponent('h4', seenIds),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fresh seenIds map must be recreated per content change
  }, [content]);

  return (
    <article className="blog-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkCallouts, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
