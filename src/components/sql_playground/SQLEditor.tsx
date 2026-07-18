import { useRef, useMemo, useCallback } from "react";
import { highlightSQL } from "../../lib/sqlHighlight";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
}

export default function SQLEditor({ value, onChange, onRun }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const highlighted = useMemo(() => highlightSQL(value), [value]);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, start) + "  " + value.substring(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const lineCount = value.split("\n").length;

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}
    >
      {/* Gutter */}
      <div
        className="select-none text-right overflow-hidden shrink-0 pt-4 pb-4"
        style={{
          minWidth: "52px",
          paddingLeft: "8px",
          paddingRight: "12px",
          color: "var(--muted-foreground)",
          lineHeight: "1.65",
          borderRight: "1px solid var(--border)",
          background: "rgba(0,0,0,0.2)",
          opacity: 0.7,
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} style={{ lineHeight: "1.65" }}>
            {i + 1}
          </div>
        ))}
      </div>

      {/* Code area */}
      <div className="relative flex-1 overflow-hidden">
        <pre
          ref={preRef}
          aria-hidden="true"
          className="absolute inset-0 p-4 m-0 overflow-hidden pointer-events-none"
          style={{
            lineHeight: "1.65",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: "var(--foreground)",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
          dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); syncScroll(); }}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full p-4 resize-none outline-none bg-transparent"
          style={{
            lineHeight: "1.65",
            fontFamily: "inherit",
            fontSize: "inherit",
            color: "transparent",
            caretColor: "var(--primary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            border: "none",
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
