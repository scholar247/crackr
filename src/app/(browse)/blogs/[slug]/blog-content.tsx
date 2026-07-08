'use client';

import { useEffect, useRef } from 'react';

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

function wrapTables(container: HTMLElement) {
  container.querySelectorAll('table').forEach((table) => {
    if (table.parentElement?.classList.contains('table-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function enhanceCodeBlocks(container: HTMLElement) {
  container.querySelectorAll('pre').forEach((pre) => {
    if (pre.dataset.enhanced) return;
    pre.dataset.enhanced = '1';

    const code = pre.querySelector('code');
    if (!code) return;

    const langClass = Array.from(code.classList).find((c) => c.startsWith('language-'));
    const langKey = langClass?.replace('language-', '') ?? '';
    const langLabel = LANG_DISPLAY[langKey] ?? (langKey ? langKey.toUpperCase() : '');

    // Wrapper so we can position the toolbar absolutely over the pre
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';

    if (langLabel) {
      const label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = langLabel;
      toolbar.appendChild(label);
    }

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent ?? '');
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch {
        copyBtn.textContent = 'Failed';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      }
    });
    toolbar.appendChild(copyBtn);

    wrapper.insertBefore(toolbar, pre);
  });
}

export function BlogContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    wrapTables(ref.current);
    enhanceCodeBlocks(ref.current);
  }, [html]);

  return (
    <article className="blog-content">
      <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
