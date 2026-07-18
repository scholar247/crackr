import { Play, AlignLeft, Copy, Trash2, Loader2 } from "lucide-react";

interface Props {
  isRunning: boolean;
  charCount: number;
  lineCount: number;
  onRun: () => void;
  onFormat: () => void;
  onCopy: () => void;
  onClear: () => void;
}

export default function EditorToolbar({
  isRunning,
  charCount,
  lineCount,
  onRun,
  onFormat,
  onCopy,
  onClear,
}: Props) {
  const actions = [
    { label: "Format", icon: <AlignLeft size={11} />, action: onFormat },
    { label: "Copy", icon: <Copy size={11} />, action: onCopy },
    { label: "Clear", icon: <Trash2 size={11} />, action: onClear },
  ];

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2 shrink-0"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--card)" }}
    >
      {/* Run button */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 hover:brightness-110 bg-primary text-primary-foreground"
      >
        {isRunning ? (
          <>
            <Loader2 size={12} className="animate-spin" /> Running…
          </>
        ) : (
          <>
            <Play size={12} fill="currentColor" />
            Run
          </>
        )}
      </button>

      <div className="w-px h-5" style={{ background: "var(--border)" }} />

      {/* Secondary actions */}
      {actions.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.action}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-opacity hover:opacity-80 bg-muted text-muted-foreground border border-border"
        >
          {btn.icon}
          {btn.label}
        </button>
      ))}

      <div className="flex-1" />

      {/* Stats */}
      <span
        className="text-xs"
        style={{
          color: "var(--muted-foreground)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {charCount} chars · {lineCount} lines
      </span>
    </div>
  );
}
