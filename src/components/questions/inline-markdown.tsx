import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Answer options are short strings (often a formula, a code token, or a couple of
// words) laid out inline next to the option-key badge — BlogContent's block-level
// typography (paragraph margins, code-block toolbars, callouts) doesn't fit that
// context, so `p` is unwrapped to a fragment and only inline-safe plugins run.
const inlineComponents: Components = {
  p: ({ children }) => <>{children}</>,
};

export function InlineMarkdown({ content, className }: { content: string; className?: string }) {
  return (
    <span className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={inlineComponents}>
        {content}
      </ReactMarkdown>
    </span>
  );
}
