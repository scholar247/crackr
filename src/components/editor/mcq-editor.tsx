'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import type { ContentBlock } from '@/types';
import {
  Bold,
  Italic,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Eraser,
  Sigma,
  FlaskConical,
  Image as ImageIcon,
  Headphones,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MCQEditorProps {
  value?: ContentBlock[];
  onChange?: (blocks: ContentBlock[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Parse Tiptap editor content into ContentBlock[].
 * Stores content as a single TEXT block; the renderer parses $...$, $$...$$, \ce{...}.
 */
function parseEditorContent(editor: Editor): ContentBlock[] {
  const text = editor.getText();
  if (!text.trim()) return [];
  return [{ type: 'TEXT', content: text }];
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={active ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={onClick}
            aria-label={label}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MCQEditor({ value, onChange, placeholder, className }: MCQEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        orderedList: false,
        listItem: false,
        bulletList: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'Type question text, use $ for math...' }),
      Superscript,
      Subscript,
    ],
    content: value?.[0]?.content ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(parseEditorContent(editor));
    },
  });

  // Sync external value changes without triggering onUpdate → onChange loop
  useEffect(() => {
    if (!editor) return;
    const externalText = value?.[0]?.type === 'TEXT' ? (value[0].content ?? '') : '';
    if (externalText === editor.getText()) return;
    // emitUpdate:false prevents re-triggering onUpdate → onChange loop
    editor.commands.setContent(externalText, { emitUpdate: false });
  }, [value, editor]);

  const insertInlineMath = useCallback(() => {
    editor?.commands.insertContent(' $  $ ');
    // Move cursor between the $$ markers
  }, [editor]);

  const insertBlockMath = useCallback(() => {
    editor?.commands.insertContent('\n$$\n\n$$\n');
  }, [editor]);

  const insertChemistry = useCallback(() => {
    editor?.commands.insertContent(' \\ce{} ');
  }, [editor]);

  const insertMedia = useCallback((type: 'image' | 'audio' | 'video') => {
    const url = prompt(`Enter ${type} URL:`);
    if (!url) return;
    const block: ContentBlock = { type: type.toUpperCase() as ContentBlock['type'], content: url };
    onChange?.([...(value ?? []), block]);
  }, [onChange, value]);

  if (!editor) return null;

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden tiptap-editor', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive('superscript')}
          label="Superscript"
        >
          <SuperscriptIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive('subscript')}
          label="Subscript"
        >
          <SubscriptIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton onClick={insertInlineMath} label="Inline Math ($...$)">
          <Sigma className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={insertBlockMath} label="Block Math ($$...$$)">
          <span className="text-xs font-mono font-bold">∑</span>
        </ToolbarButton>
        <ToolbarButton onClick={insertChemistry} label="Chemistry (\\ce{...})">
          <FlaskConical className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton onClick={() => insertMedia('image')} label="Insert Image URL">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMedia('audio')} label="Insert Audio URL">
          <Headphones className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => insertMedia('video')} label="Insert Video URL">
          <Video className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          label="Clear formatting"
        >
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none focus-within:outline-none"
      />

      {/* Media URL blocks preview */}
      {value && value.filter((b) => b.type !== 'TEXT').length > 0 && (
        <div className="border-t border-border p-2 space-y-1">
          {value
            .filter((b) => b.type !== 'TEXT')
            .map((block, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium uppercase">{block.type}</span>
                <span className="truncate">{block.content}</span>
                <button
                  type="button"
                  className="ml-auto text-destructive hover:text-destructive/80"
                  onClick={() => onChange?.(value.filter((_, idx) => idx !== value.indexOf(block)))}
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
