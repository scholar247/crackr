'use client';

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { CALLOUT_META } from '@/components/blog/callout-meta';
import type { CalloutVariant } from './callout';

// Same markup as the published page's CalloutBlock (`.callout > svg.callout-icon + .callout-body`),
// so the shared stylesheet draws it identically while editing.
export function CalloutView({ node }: NodeViewProps) {
  const variant = (node.attrs.variant as CalloutVariant) ?? 'info';
  const Icon = (CALLOUT_META[variant] ?? CALLOUT_META.info).icon;
  return (
    <NodeViewWrapper className={`callout callout-${variant}`} data-callout={variant}>
      <span contentEditable={false} className="callout-icon-slot">
        <Icon className="callout-icon" aria-hidden="true" />
      </span>
      <NodeViewContent className="callout-body" />
    </NodeViewWrapper>
  );
}
