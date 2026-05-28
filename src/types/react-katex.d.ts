declare module 'react-katex' {
  import { ReactElement } from 'react';

  interface KatexProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => ReactElement;
    settings?: Record<string, unknown>;
  }

  export function InlineMath(props: KatexProps): ReactElement;
  export function BlockMath(props: KatexProps): ReactElement;
}
