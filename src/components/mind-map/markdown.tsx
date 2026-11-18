import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import '@/lib/katex-setup';

// Server-rendered Markdown for mind-map pages (topic content, revision notes) so it is in
// the page HTML for readers without JS and for crawlers. Maths renders with KaTeX like the
// blog; raw HTML is never rendered and the API rejects unsafe Markdown on save.
const base: Components = {
  a: ({ href, children }) =>
    href && /^https?:\/\//i.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <a href={href}>{children}</a>
    ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full min-w-0! text-sm">{children}</table>
    </div>
  ),
};

// Page headings are fixed (H1 chapter, H2 sections, H3 topics), so body headings start one
// level below whatever contains them: H3 inside a section, H4 inside a topic.
const UNDER_SECTION: Components = { ...base, h1: ({ children }) => <h3>{children}</h3>, h2: ({ children }) => <h3>{children}</h3>, h3: ({ children }) => <h4>{children}</h4> };
const UNDER_TOPIC: Components = { ...base, h1: ({ children }) => <h4>{children}</h4>, h2: ({ children }) => <h4>{children}</h4>, h3: ({ children }) => <h5>{children}</h5> };

export function MindMapMarkdown({ markdown, within = 'topic' }: { markdown: string; within?: 'section' | 'topic' }) {
  return (
    <div className="blog-content text-sm [&_h3]:mt-4 [&_h3]:text-base [&_h4]:mt-4 [&_h4]:text-base [&_h5]:mt-3 [&_li]:text-sm [&_p]:text-sm [&_p]:leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={within === 'section' ? UNDER_SECTION : UNDER_TOPIC}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
