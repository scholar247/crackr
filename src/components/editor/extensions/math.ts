import { Node, InputRule, mergeAttributes } from '@tiptap/core';
import type { MarkdownToken, MarkdownParseHelpers } from '@tiptap/core';
import katex from 'katex';
import '@/lib/katex-setup';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      /** Turns the selection (if any) into an inline formula, or inserts an empty one and opens it for editing. */
      insertInlineMath: () => ReturnType;
      insertBlockMath: (latex?: string) => ReturnType;
    };
  }
}

function paint(el: HTMLElement, latex: string, displayMode: boolean) {
  if (!latex.trim()) {
    el.textContent = displayMode ? 'Empty formula — click to edit' : 'formula';
    el.classList.add('math-empty');
    return;
  }
  el.classList.remove('math-empty');
  // Same options the preview's rehype-katex uses (errors render inline in red, never throw),
  // so a formula that renders in one place renders — or fails — identically in the other.
  katex.render(latex, el, { displayMode, throwOnError: false });
}

/**
 * Inline `$…$` and block `$$…$$` formulas as atom nodes. The node stores the raw LaTeX and
 * serialises back to the exact same delimiters remark-math parses on the render side, so the
 * stored markdown never changes shape. `\ce{…}` chemistry works via the mhchem import above.
 */
function createMathNode(name: 'mathInline' | 'mathBlock') {
  const displayMode = name === 'mathBlock';
  const tag = displayMode ? 'div' : 'span';

  return Node.create({
    name,
    group: displayMode ? 'block' : 'inline',
    inline: !displayMode,
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
      return {
        latex: {
          default: '',
          parseHTML: (el) => el.getAttribute('data-latex') ?? '',
          renderHTML: (attrs) => ({ 'data-latex': attrs.latex }),
        },
      };
    },

    parseHTML() {
      return [{ tag: `${tag}[data-math="${displayMode ? 'block' : 'inline'}"]` }];
    },

    renderHTML({ HTMLAttributes, node }) {
      return [tag, mergeAttributes(HTMLAttributes, { 'data-math': displayMode ? 'block' : 'inline' }), displayMode ? `$$\n${node.attrs.latex}\n$$` : `$${node.attrs.latex}$`];
    },

    // ── Markdown ────────────────────────────────────────────────────────────
    markdownTokenizer: displayMode
      ? {
          name,
          level: 'block' as const,
          start: (src: string) => src.match(/^\$\$/m)?.index ?? -1,
          tokenize(src: string) {
            const fenced = /^\$\$[ \t]*\n([\s\S]+?)\n[ \t]*\$\$[ \t]*(?:\n|$)/.exec(src);
            const oneLine = /^\$\$([^\n]+?)\$\$[ \t]*(?:\n|$)/.exec(src);
            const m = fenced ?? oneLine;
            if (!m) return undefined;
            return { type: name, raw: m[0], text: m[1].trim() };
          },
        }
      : {
          name,
          level: 'inline' as const,
          start: (src: string) => src.indexOf('$'),
          tokenize(src: string) {
            // Opening `$` must hug the content, closing `$` must not be followed by a digit
            // ("costs $5 and $10" stays text) — the same guard remark-math applies in practice.
            const m = /^\$(?!\$)(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)\$(?!\d)/.exec(src);
            if (!m) return undefined;
            return { type: name, raw: m[0], text: m[1] };
          },
        },

    parseMarkdown: (token: MarkdownToken, h: MarkdownParseHelpers) => h.createNode(name, { latex: (token as { text?: string }).text ?? '' }),

    renderMarkdown: (node: { attrs?: { latex?: string } }) => {
      const latex = node.attrs?.latex ?? '';
      // An empty formula would serialise to a bare `$$`, which the preview reads as the start of
      // a block formula and swallows what follows — write nothing instead.
      if (!latex.trim()) return '';
      return displayMode ? `$$\n${latex}\n$$` : `$${latex}$`;
    },

    // ── Commands ────────────────────────────────────────────────────────────
    // Each node registers only its own command — commands are merged by name across extensions,
    // so a shared definition in both nodes would let the later one shadow the earlier.
    addCommands() {
      if (displayMode) {
        return {
          insertBlockMath:
            (latex = '') =>
            ({ commands }) =>
              commands.insertContent({ type: name, attrs: { latex } }),
        };
      }
      return {
        insertInlineMath:
          () =>
          ({ state, chain }) => {
            const { from, to, empty } = state.selection;
            const latex = empty ? '' : state.doc.textBetween(from, to, ' ');
            return chain().insertContentAt({ from, to }, { type: name, attrs: { latex } }).run();
          },
      };
    },

    // Typing `$x^2$` turns into a formula as soon as the closing `$` is typed.
    addInputRules() {
      if (displayMode) return [];
      return [
        new InputRule({
          find: /(?:^|[^$\\])\$([^$\s][^$\n]*?)\$$/,
          handler: ({ state, range, match }) => {
            const latex = match[1];
            if (/\s$/.test(latex)) return null;
            const start = range.from + (match[0].length - (latex.length + 2));
            state.tr.replaceWith(start, range.to, this.type.create({ latex }));
          },
        }),
      ];
    },

    // ── Rendering + in-place editing ────────────────────────────────────────
    addNodeView() {
      return ({ node: initialNode, getPos, editor }) => {
        let node = initialNode;
        const dom = document.createElement(tag);
        dom.className = `math-node ${displayMode ? 'math-block' : 'math-inline'}`;
        dom.contentEditable = 'false';

        const view = document.createElement(tag);
        view.className = 'math-view';
        dom.appendChild(view);
        paint(view, node.attrs.latex, displayMode);

        let panel: HTMLElement | null = null;
        let input: HTMLTextAreaElement | null = null;

        const close = (apply: boolean) => {
          if (!panel || !input) return;
          const value = input.value;
          const el = panel;
          panel = null;
          input = null;
          el.remove();
          const pos = getPos();
          if (apply && pos !== undefined && value !== node.attrs.latex) {
            editor.view.dispatch(editor.view.state.tr.setNodeMarkup(pos, undefined, { latex: value }));
          } else {
            paint(view, node.attrs.latex, displayMode);
          }
          editor.view.focus();
        };

        const open = () => {
          if (panel || !editor.isEditable) return;
          panel = document.createElement('div');
          panel.className = 'math-editor';
          input = document.createElement('textarea');
          input.value = node.attrs.latex;
          input.rows = displayMode ? 3 : 2;
          input.spellcheck = false;
          input.placeholder = 'LaTeX, e.g. \\frac{a}{b}   ·   chemistry: \\ce{2H2 + O2 -> 2H2O}';
          const hint = document.createElement('div');
          hint.className = 'math-hint';
          hint.textContent = displayMode ? 'Ctrl/⌘+Enter to apply · Esc to cancel' : 'Enter to apply · Esc to cancel';
          input.addEventListener('input', () => paint(view, input!.value, displayMode));
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              close(false);
            } else if (e.key === 'Enter' && (!displayMode || e.metaKey || e.ctrlKey) && !e.shiftKey) {
              e.preventDefault();
              close(true);
            }
          });
          input.addEventListener('blur', () => close(true));
          panel.append(input, hint);
          dom.appendChild(panel);
          input.focus();
        };

        view.addEventListener('click', (e) => {
          e.preventDefault();
          open();
        });

        // A freshly inserted (empty) formula opens straight into the editor; one that is merely
        // loaded from saved markdown never does.
        // Toolbar/slash commands refocus the editor on the next animation frame; wait past it so the
        // formula editor takes focus last instead of being blurred (and closed) straight away.
        if (!node.attrs.latex && editor.isInitialized) setTimeout(open, 80);

        return {
          dom,
          update(updated) {
            if (updated.type !== node.type) return false;
            node = updated;
            if (!panel) paint(view, node.attrs.latex, displayMode);
            return true;
          },
          stopEvent: (event) => !!panel && panel.contains(event.target as globalThis.Node),
          ignoreMutation: () => true,
          selectNode: () => dom.classList.add('is-selected'),
          deselectNode: () => dom.classList.remove('is-selected'),
        };
      };
    },
  });
}

export const MathInline = createMathNode('mathInline');
export const MathBlock = createMathNode('mathBlock');
