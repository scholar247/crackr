'use client';

import { useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { highlightSQL } from '@/lib/sql-playground/highlight';

export interface SqlEditorHandle {
  /** The selected text, or null when nothing is selected. */
  getSelection: () => string | null;
  focus: () => void;
  /** Insert text at the cursor (replacing any selection), padded with spaces as needed. */
  insert: (text: string) => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Ctrl/⌘+Enter. Receives the selected text when there is a selection. */
  onRun: (selection: string | null) => void;
  onFormat: () => void;
  ref?: Ref<SqlEditorHandle>;
}

const LINE_HEIGHT = 20;
const PADDING = 12;
const INDENT = '  ';

// A transparent <textarea> on top of a highlighted <pre> with identical metrics: the
// textarea owns editing (caret, selection, undo, IME) and the <pre> only paints colors.
// No wrapping, so each visual row is one source line and the gutter numbers stay aligned.
export function SqlEditor({ value, onChange, onRun, onFormat, ref }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const highlighted = useMemo(() => highlightSQL(value), [value]);
  const lineCount = useMemo(() => value.split('\n').length, [value]);

  const getSelection = () => {
    const ta = textareaRef.current;
    if (!ta || ta.selectionStart === ta.selectionEnd) return null;
    const text = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    return text.trim() ? text : null;
  };


  const syncScroll = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  };

  // Replace [start, end) with `text` through the browser's editing pipeline, so the
  // change lands on the native undo stack (setting `value` directly would wipe it).
  const replaceRange = (start: number, end: number, text: string, select?: [number, number]) => {
    const ta = textareaRef.current!;
    ta.focus();
    ta.setSelectionRange(start, end);
    const ok = typeof document.execCommand === 'function' && document.execCommand('insertText', false, text);
    if (!ok) onChange(ta.value.slice(0, start) + text + ta.value.slice(end));
    requestAnimationFrame(() => {
      if (select) ta.setSelectionRange(select[0], select[1]);
    });
  };

  const insert = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    const before = s > 0 && !/[\s(,.]/.test(v[s - 1]) ? ' ' : '';
    const after = e < v.length && !/[\s),;.]/.test(v[e]) ? ' ' : '';
    const pos = s + before.length + text.length + after.length;
    replaceRange(s, e, before + text + after, [pos, pos]);
  };

  useImperativeHandle(ref, () => ({ getSelection, insert, focus: () => textareaRef.current?.focus() }));

  const toggleLineComment = () => {
    const ta = textareaRef.current!;
    const { selectionStart: s, selectionEnd: e } = ta;
    const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
    const nl = ta.value.indexOf('\n', e > s && ta.value[e - 1] === '\n' ? e - 1 : e);
    const lineEnd = nl === -1 ? ta.value.length : nl;
    const lines = ta.value.slice(lineStart, lineEnd).split('\n');
    const allCommented = lines.filter((l) => l.trim()).every((l) => /^\s*--/.test(l));
    const next = lines
      .map((l) => (allCommented ? l.replace(/^(\s*)-- ?/, '$1') : l.trim() ? `-- ${l}` : l))
      .join('\n');
    replaceRange(lineStart, lineEnd, next, [lineStart, lineStart + next.length]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key === 'Enter') {
      e.preventDefault();
      onRun(getSelection());
      return;
    }
    if (mod && e.key === '/') {
      e.preventDefault();
      toggleLineComment();
      return;
    }
    if (e.shiftKey && e.altKey && (e.key === 'F' || e.key === 'f')) {
      e.preventDefault();
      onFormat();
      return;
    }
    if (e.key === 'Tab' && !mod && !e.altKey) {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: s, selectionEnd: end } = ta;
      if (!e.shiftKey && s === end) {
        replaceRange(s, end, INDENT, [s + INDENT.length, s + INDENT.length]);
        return;
      }
      // Indent / outdent every selected line.
      const lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
      const block = ta.value.slice(lineStart, end);
      const next = e.shiftKey
        ? block.replace(/^ {1,2}/gm, '')
        : block.replace(/^/gm, INDENT);
      replaceRange(lineStart, end, next, [lineStart, lineStart + next.length]);
    }
  };

  const textStyle: React.CSSProperties = {
    lineHeight: `${LINE_HEIGHT}px`,
    padding: PADDING,
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    tabSize: 2,
  };

  return (
    <div className="sql-highlight flex h-full overflow-hidden font-mono text-[13px]">
      <div
        ref={gutterRef}
        aria-hidden
        className="w-12 shrink-0 select-none overflow-hidden border-r border-border bg-muted/60 text-right text-[11px] text-muted-foreground/70"
        style={{ paddingTop: PADDING, paddingBottom: PADDING, paddingRight: 10, lineHeight: `${LINE_HEIGHT}px` }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
        {/* Room for the textarea's horizontal scrollbar, so the last number can align. */}
        <div style={{ height: 16 }} />
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        <pre
          ref={preRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 m-0 overflow-hidden font-[inherit] text-foreground"
          style={textStyle}
          // highlightSQL escapes every character of the input.
          dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          aria-label="SQL editor"
          placeholder="Write a query, then press Ctrl+Enter to run it"
          className="absolute inset-0 h-full w-full resize-none overflow-auto border-none bg-transparent font-[inherit] text-transparent caret-primary outline-none selection:bg-primary/25 placeholder:text-muted-foreground/60"
          style={textStyle}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
