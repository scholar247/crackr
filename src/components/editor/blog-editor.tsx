'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Link2Off as LinkOff,
  Eraser,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  FileCode2,
} from 'lucide-react';

interface BlogEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarBtn({
  onClick,
  active,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={80}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={active ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BlogEditor({ value, onChange, placeholder, className }: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: 'rounded-md bg-muted p-4 font-mono text-sm' } },
        code: { HTMLAttributes: { class: 'rounded bg-muted px-1.5 py-0.5 font-mono text-sm' } },
        blockquote: { HTMLAttributes: { class: 'border-l-4 border-border pl-4 italic text-muted-foreground' } },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'text-primary underline underline-offset-2 hover:opacity-80' },
      }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write your blog content here…' }),
      Superscript,
      Subscript,
    ],
    content: value ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange?.(html);
    },
  });

  // Sync external value without triggering onChange loop
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === (value ?? '')) return;
    editor.commands.setContent(value ?? '', { emitUpdate: false });
  }, [value, editor]);

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes('link').href as string | undefined;
    const url = prompt('Enter URL:', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  if (!editor) return null;

  const isLinkActive = editor.isActive('link');

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden flex flex-col blog-tiptap', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5 shrink-0">

        {/* Paragraph / Heading */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          label="Paragraph"
        >
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          label="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          active={editor.isActive('heading', { level: 4 })}
          label="Heading 4"
        >
          <Heading4 className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Inline marks */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="Bold (Ctrl+B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="Italic (Ctrl+I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          label="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          label="Inline Code"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive('superscript')}
          label="Superscript"
        >
          <SuperscriptIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive('subscript')}
          label="Subscript"
        >
          <SubscriptIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Block elements */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="Ordered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          label="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          label="Code block (pre)"
        >
          <FileCode2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="Divider"
        >
          <Minus className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Link */}
        <ToolbarBtn onClick={setLink} active={isLinkActive} label={isLinkActive ? 'Edit link' : 'Insert link'}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>
        {isLinkActive && (
          <ToolbarBtn
            onClick={() => editor.chain().focus().unsetLink().run()}
            label="Remove link"
          >
            <LinkOff className="h-3.5 w-3.5" />
          </ToolbarBtn>
        )}

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          label="Clear formatting"
        >
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose prose-zinc dark:prose-invert max-w-none flex-1 overflow-y-auto focus-within:outline-none [&_.tiptap]:min-h-[320px] [&_.tiptap]:p-4 [&_.tiptap]:focus:outline-none"
      />
    </div>
  );
}
