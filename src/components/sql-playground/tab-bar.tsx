'use client';

import { useState } from 'react';
import { CircleAlert, CircleCheck, FileText, LoaderCircle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tab } from '@/lib/sql-playground/types';

interface Props {
  tabs: Tab[];
  activeTab: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function TabBar({ tabs, activeTab, onSelect, onAdd, onClose, onRename }: Props) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="flex h-9 shrink-0 items-end gap-0.5 overflow-x-auto border-b border-border bg-card px-2" role="tablist">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        const icon = tab.isRunning ? (
          <LoaderCircle className="h-3 w-3 animate-spin text-primary" />
        ) : tab.run?.error ? (
          <CircleAlert className="h-3 w-3 text-[var(--sql-err)]" />
        ) : tab.run ? (
          <CircleCheck className="h-3 w-3 text-[var(--sql-ok)]" />
        ) : (
          <FileText className="h-3 w-3" />
        );

        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(tab.id)}
            onDoubleClick={() => setEditing(tab.id)}
            title="Double-click to rename"
            className={cn(
              'group relative -mb-px flex h-8 max-w-52 shrink-0 cursor-pointer items-center gap-1.5 rounded-t-md border border-b-0 px-3 font-mono text-xs',
              active
                ? 'border-border bg-background text-foreground before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-md before:bg-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {icon}
            {editing === tab.id ? (
              <input
                autoFocus
                defaultValue={tab.title}
                className="w-28 bg-transparent outline-none"
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  onRename(tab.id, e.target.value.trim() || tab.title);
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setEditing(null);
                }}
              />
            ) : (
              <span className="truncate">{tab.title}</span>
            )}
            {tabs.length > 1 && (
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
                className="rounded p-0.5 opacity-0 hover:bg-[var(--sql-err)]/15 hover:text-[var(--sql-err)] focus-visible:opacity-100 group-hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAdd}
        aria-label="New query tab"
        className="mb-1 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
