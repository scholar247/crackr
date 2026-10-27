import { Node, mergeAttributes } from '@tiptap/core';
import type { MarkdownToken, MarkdownParseHelpers, MarkdownRendererHelpers, MarkdownLexerConfiguration } from '@tiptap/core';

export type CalloutVariant = 'info' | 'warning' | 'tip' | 'danger';

const VARIANTS: CalloutVariant[] = ['info', 'warning', 'tip', 'danger'];
const OPEN_RE = new RegExp(`^:::(${VARIANTS.join('|')})[ \\t]*\\n`);
const START_RE = new RegExp(`^:::(${VARIANTS.join('|')})\\s*$`, 'm');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attributes?: { variant: CalloutVariant }) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

/**
 * Serializes as `:::info ... :::` (bare Docusaurus-style admonition fences) —
 * kept deliberately braces-free so the exact same syntax parses with
 * remark-directive on the render side (`:::name{attrs}` requires no space
 * before `{`, which Tiptap's own `createBlockMarkdownSpec` helper always
 * emits — this hand-rolled tokenizer avoids that mismatch entirely).
 */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'info' as CalloutVariant,
        parseHTML: (element) => element.getAttribute('data-callout') ?? 'info',
        renderHTML: (attributes) => ({
          'data-callout': attributes.variant,
          class: `callout callout-${attributes.variant}`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCallout:
        (attributes) =>
        ({ commands }) =>
          commands.wrapIn(this.name, attributes),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },

  parseMarkdown: (token: MarkdownToken, h: MarkdownParseHelpers) => {
    const variant = (token.attributes as { variant?: CalloutVariant } | undefined)?.variant ?? 'info';
    const content = h.parseChildren(token.tokens ?? []);
    return h.createNode('callout', { variant }, content);
  },

  markdownTokenizer: {
    name: 'callout',
    level: 'block',
    start(src: string) {
      return src.match(START_RE)?.index ?? -1;
    },
    tokenize(src: string, _tokens: MarkdownToken[], lexer: MarkdownLexerConfiguration) {
      const openMatch = src.match(OPEN_RE);
      if (!openMatch) return undefined;
      const variant = openMatch[1] as CalloutVariant;

      const rest = src.slice(openMatch[0].length);
      const lines = rest.split('\n');
      const closeLineIndex = lines.findIndex((line) => line.trim() === ':::');
      if (closeLineIndex === -1) return undefined;

      const innerSrc = lines.slice(0, closeLineIndex).join('\n').trim();
      const raw = openMatch[0] + lines.slice(0, closeLineIndex + 1).join('\n') + '\n';

      const tokens = innerSrc ? lexer.blockTokens(innerSrc) : [];
      tokens.forEach((token) => {
        if (token.text && (!token.tokens || token.tokens.length === 0)) {
          token.tokens = lexer.inlineTokens(token.text);
        }
      });

      return { type: 'callout', raw, attributes: { variant }, tokens };
    },
  },

  renderMarkdown: (node: { attrs?: { variant?: CalloutVariant }; content?: unknown[] }, h: MarkdownRendererHelpers) => {
    const variant = node.attrs?.variant ?? 'info';
    const rendered = h.renderChildren((node.content ?? []) as Parameters<MarkdownRendererHelpers['renderChildren']>[0], '\n\n');
    return `:::${variant}\n\n${rendered}\n\n:::`;
  },
});
