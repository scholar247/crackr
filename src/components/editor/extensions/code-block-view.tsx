'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { LANG_DISPLAY } from '@/lib/code-languages';

// One option per distinct display name (js/javascript collapse to the first key).
const LANGUAGES = Object.entries(LANG_DISPLAY).filter(([, label], i, all) => all.findIndex(([, l]) => l === label) === i);

// Same markup as the published page's CodeBlock (`.code-block-wrapper > .code-toolbar + pre`),
// with the static language label swapped for a picker so authors can set it visually.
export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  const language = (node.attrs.language as string | null) ?? '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <div className="code-toolbar" contentEditable={false}>
        <select
          className="code-lang-select"
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value || null })}
          aria-label="Code language"
        >
          <option value="">Plain text</option>
          {language && !LANGUAGES.some(([key]) => key === language) && <option value={language}>{language.toUpperCase()}</option>}
          {LANGUAGES.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className={copied ? 'copy-btn copied' : 'copy-btn'} onClick={copy}>
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
      <pre>
        <NodeViewContent as={'code' as unknown as 'div'} className={language ? `language-${language}` : undefined} />
      </pre>
    </NodeViewWrapper>
  );
}
