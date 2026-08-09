'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-sm font-medium',
        // Dev-tool-aesthetic label from the spec (JetBrains Mono, uppercase,
        // 12px, muted) — opt-in per field, not the site-wide default, since
        // forcing this onto every form label (including student-facing signup/
        // profile fields) is a bigger UX call than a color/font swap.
        caps: 'font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant }), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
