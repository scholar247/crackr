'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TopicTreeNode } from '@/types';
import { cn } from '@/lib/utils';

export interface TopicTreeSelectProps {
  tree: TopicTreeNode[];
  value: string | null;
  onChange: (topicId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** When true, all nodes are selectable regardless of inSyllabus flag */
  selectableAll?: boolean;
  /** Selected topic object for breadcrumb display */
  selectedTopic?: TopicTreeNode | null;
}

// ─── Flat search helper ────────────────────────────────────────────────────────

function flattenTree(nodes: TopicTreeNode[]): TopicTreeNode[] {
  const result: TopicTreeNode[] = [];
  function walk(node: TopicTreeNode) {
    result.push(node);
    for (const child of node.children) walk(child);
  }
  for (const node of nodes) walk(node);
  return result;
}

function findNode(nodes: TopicTreeNode[], id: string): TopicTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
}

// ─── Tree node row ────────────────────────────────────────────────────────────

function TreeNodeRow({
  node,
  selectedId,
  onSelect,
  defaultExpanded,
  selectableAll,
}: {
  node: TopicTreeNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  defaultExpanded?: boolean;
  selectableAll?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? node.depth === 0);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;
  // Structural ancestor nodes (inSyllabus=false) are shown but not selectable,
  // unless selectableAll overrides this (e.g. MCQ editor needs all nodes selectable)
  const isSelectable = selectableAll || node.inSyllabus !== false;

  const depthPadding: Record<number, string> = {
    0: 'pl-2',
    1: 'pl-6',
    2: 'pl-10',
    3: 'pl-14',
  };
  const padClass = depthPadding[node.depth] ?? 'pl-14';

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm transition-colors',
          padClass,
          isSelectable
            ? isSelected
              ? 'bg-primary/10 text-primary font-medium cursor-pointer'
              : 'hover:bg-accent cursor-pointer'
            : 'text-muted-foreground italic cursor-default',
          node.depth === 0 && 'font-medium'
        )}
        onClick={() => {
          if (isSelectable) onSelect(node.id);
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className="flex-1 truncate">{node.name}</span>

        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              defaultExpanded={false}
              selectableAll={selectableAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function TopicTreeSelect({
  tree,
  value,
  onChange,
  placeholder = 'Select topic',
  disabled = false,
  selectableAll = false,
}: TopicTreeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const flat = useMemo(() => flattenTree(tree), [tree]);
  const selectedNode = useMemo(
    () => (value ? flat.find((n) => n.id === value) : null),
    [value, flat]
  );

  // Build search-filtered flat list
  const filtered = useMemo(() => {
    if (!search) return null; // null = show tree view
    const lower = search.toLowerCase();
    return flat.filter(
      (n) => n.name.toLowerCase().includes(lower) && (selectableAll || n.inSyllabus !== false)
    );
  }, [search, flat, selectableAll]);

  const breadcrumb =
    selectedNode && selectedNode.pathNames.length > 0
      ? [...selectedNode.pathNames, selectedNode.name].join(' › ')
      : selectedNode?.name ?? null;

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="truncate">
              {selectedNode?.name ?? placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start">
          {/* Search */}
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics…"
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-sm"
            />
          </div>

          {/* Clear option */}
          {value && (
            <div
              className="px-3 py-2 text-xs text-muted-foreground hover:bg-accent cursor-pointer border-b border-border"
              onClick={() => { onChange(null); setOpen(false); }}
            >
              Clear selection
            </div>
          )}

          {/* Tree or search results */}
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered !== null ? (
              // Flat search results
              filtered.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">No topics found</p>
              ) : (
                filtered.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => { onChange(node.id); setOpen(false); setSearch(''); }}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer hover:bg-accent',
                      node.id === value && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <span className="flex-1">{node.name}</span>
                    <span className="text-xs text-muted-foreground">{node.pathNames.join(' › ')}</span>
                    {node.id === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                ))
              )
            ) : tree.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground text-center">No topics available</p>
            ) : (
              tree.map((node) => (
                <TreeNodeRow
                  key={node.id}
                  node={node}
                  selectedId={value}
                  onSelect={(id) => { onChange(id); setOpen(false); }}
                  defaultExpanded={node.depth === 0}
                  selectableAll={selectableAll}
                />
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Breadcrumb */}
      {breadcrumb && (
        <p className="text-xs text-muted-foreground pl-1 truncate">{breadcrumb}</p>
      )}
    </div>
  );
}
