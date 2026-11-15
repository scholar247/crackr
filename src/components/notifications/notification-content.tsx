import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// External links in a notification (official circulars, cbse.gov.in) open in a new tab;
// internal ones stay in-app. react-markdown never renders raw HTML and strips unsafe URL
// schemes, and the API rejects unsafe Markdown on write (see notification.schema.ts).
const components: Components = {
  a: ({ href, children }) =>
    href && /^https?:\/\//i.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <a href={href}>{children}</a>
    ),
  // Notices sit under an H3 title on the exam page's board; keep body headings below it.
  h1: ({ children }) => <h4>{children}</h4>,
  h2: ({ children }) => <h4>{children}</h4>,
  h3: ({ children }) => <h5>{children}</h5>,
  h4: ({ children }) => <h5>{children}</h5>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      {/* min-w-0! beats the prose min-width (480px) so tables fit the board; wide ones still scroll. */}
      <table className="w-full min-w-0! text-sm">{children}</table>
    </div>
  ),
};

/**
 * A notification's Markdown body, rendered on the server with the site's prose styles (in
 * a slightly smaller size to fit the notification board).
 */
export function NotificationContent({ markdown }: { markdown: string }) {
  return (
    <div className="blog-content text-sm [&_h4]:mt-4 [&_h4]:text-base [&_h5]:mt-3 [&_h5]:text-sm [&_li]:text-sm [&_p]:text-sm [&_p]:leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
