import { Info, AlertTriangle, Lightbulb, OctagonAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import type { CalloutVariant } from '@/components/editor/extensions/callout';

// Shared by the published-article renderer and the editor's callout node view so both draw
// the exact same icon for each variant.
export const CALLOUT_META: Record<CalloutVariant, { icon: ComponentType<{ className?: string }>; label: string }> = {
  info: { icon: Info, label: 'Info' },
  warning: { icon: AlertTriangle, label: 'Warning' },
  tip: { icon: Lightbulb, label: 'Tip' },
  danger: { icon: OctagonAlert, label: 'Danger' },
};
