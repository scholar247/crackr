'use client';

import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TiptapImage from '@tiptap/extension-image';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Markdown } from '@tiptap/markdown';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Callout, type CalloutVariant } from './extensions/callout';
import { CalloutView } from './extensions/callout-view';
import { CodeBlockView } from './extensions/code-block-view';
import { MathInline, MathBlock } from './extensions/math';
import { SlashCommand } from './extensions/slash-command';
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
  Table2,
  Rows3,
  Columns3,
  Trash2,
  Image as ImageIcon,
  Info,
  AlertTriangle,
  Lightbulb,
  OctagonAlert,
  Sigma,
  SquareSigma,
} from 'lucide-react';

interface BlogEditorProps {
  value?: string;
  onChange?: (markdown: string) => void;
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

const CALLOUT_VARIANTS: { variant: CalloutVariant; label: string; icon: typeof Info }[] = [
  { variant: 'info', label: 'Info callout', icon: Info },
  { variant: 'warning', label: 'Warning callout', icon: AlertTriangle },
  { variant: 'tip', label: 'Tip callout', icon: Lightbulb },
  { variant: 'danger', label: 'Danger callout', icon: OctagonAlert },
];

// Two serialisation fixes so what the editor saves renders on the published page exactly as it
// looks while editing:
//  • indentation 4 — Tiptap indents nested list content by a fixed 2 spaces, but a CommonMark
//    parser (the preview's remark) only nests under a numbered item ("1. ") at ≥3 spaces; 4 is
//    safe for any marker up to "99. " and still nests under "- ".
//  • `$` escaping — a literal dollar in text must be written `\$`, otherwise "costs \$5 and
//    \$10" is saved as "$5 and $10" and the preview reads the span between them as a formula.
const MarkdownSerialization = Markdown.extend({
  onBeforeCreate(props) {
    this.parent?.(props); // the stock hook builds editor.markdown — patch it right after
    const manager = (this.editor as unknown as { markdown?: { escapeMarkdownSyntax?: (t: string) => string; __dollarPatched?: boolean } }).markdown;
    if (!manager?.escapeMarkdownSyntax || manager.__dollarPatched) return;
    const original = manager.escapeMarkdownSyntax.bind(manager);
    manager.escapeMarkdownSyntax = (text: string) => original(text).replace(/\$/g, '\\$');
    manager.__dollarPatched = true;
  },
}).configure({ indentation: { style: 'space', size: 4 } });

// The editor deliberately carries NO styling of its own: every node renders the same markup the
// published page does (headings, lists, tables, quotes, code, callouts, formulas), and the
// surface wears the `blog-content` class, so what you edit is drawn by the very same stylesheet
// as the preview. Add a new block type here AND in BlogContent, nowhere else.
export function createEditorExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      codeBlock: false,
    }),
    CodeBlock.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
      },
    }),
    Link.configure({ openOnClick: false, autolink: true }),
    Placeholder.configure({ placeholder: placeholder ?? 'Write your blog content here… (type “/” for blocks)' }),
    // Tiptap's own sup/sub marks have no markdown writer, so saving silently flattened `x²` to
    // `x2`. Serialise as the inline HTML tags BlogContent's remarkSupSub turns back into sup/sub.
    Superscript.extend({ renderMarkdown: (node, h) => `<sup>${h.renderChildren(node)}</sup>` }),
    Subscript.extend({ renderMarkdown: (node, h) => `<sub>${h.renderChildren(node)}</sub>` }),
    TiptapImage,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Callout.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CalloutView);
      },
    }),
    MathInline,
    MathBlock,
    SlashCommand,
    MarkdownSerialization,
  ];
}

export function BlogEditor({ value, onChange, placeholder, className }: BlogEditorProps) {
  const editor = useEditor({
    extensions: createEditorExtensions(placeholder),
    editorProps: { attributes: { class: 'blog-content blog-editor-surface' } },
    content: value ?? '',
    contentType: 'markdown',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const markdown = editor.isEmpty ? '' : editor.getMarkdown();
      onChange?.(markdown);
    },
  });

  // Sync external value without triggering onChange loop
  useEffect(() => {
    if (!editor) return;
    if (editor.getMarkdown() === (value ?? '')) return;
    editor.commands.setContent(value ?? '', { emitUpdate: false, contentType: 'markdown' });
  }, [value, editor]);

  // Client-side UX nicety only — the real enforcement is server-side
  // (findUnsafeMarkdownContent / HttpsUrlSchema in blog.schema.ts), since a
  // direct API call bypasses the editor entirely.
  const isSafeHttpsUrl = (value: string) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  };

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes('link').href as string | undefined;
    const url = prompt('Enter URL (must start with https://):', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (!isSafeHttpsUrl(url)) {
      alert('Links must be a valid https:// URL.');
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    const src = prompt('Image URL (must start with https://):');
    if (!src) return;
    if (!isSafeHttpsUrl(src)) {
      alert('Images must be a valid https:// URL.');
      return;
    }
    const alt = prompt('Alt text (required to publish this article):') ?? '';
    editor?.chain().focus().setImage({ src, alt }).run();
  }, [editor]);

  const toggleCallout = useCallback(
    (variant: CalloutVariant) => {
      if (editor?.isActive('callout', { variant })) {
        editor.chain().focus().unsetCallout().run();
      } else {
        editor?.chain().focus().setCallout({ variant }).run();
      }
    },
    [editor],
  );

  if (!editor) return null;

  const isLinkActive = editor.isActive('link');
  const isInTable = editor.isActive('table');

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

        {/* Callouts */}
        {CALLOUT_VARIANTS.map(({ variant, label, icon: Icon }) => (
          <ToolbarBtn
            key={variant}
            onClick={() => toggleCallout(variant)}
            active={editor.isActive('callout', { variant })}
            label={label}
          >
            <Icon className="h-3.5 w-3.5" />
          </ToolbarBtn>
        ))}

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Formulas (LaTeX + chemistry via \ce{…}) */}
        <ToolbarBtn onClick={() => editor.chain().focus().insertInlineMath().run()} label="Inline formula ($…$)">
          <Sigma className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().insertBlockMath().run()} label="Block formula ($$…$$)">
          <SquareSigma className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Link / Image */}
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
        <ToolbarBtn onClick={insertImage} label="Insert image">
          <ImageIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Table */}
        <ToolbarBtn
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          active={isInTable}
          label="Insert table"
        >
          <Table2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        {isInTable && (
          <>
            <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()} label="Add row">
              <Rows3 className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().addColumnAfter().run()} label="Add column">
              <Columns3 className="h-3.5 w-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} label="Delete table">
              <Trash2 className="h-3.5 w-3.5" />
            </ToolbarBtn>
          </>
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
        className="flex-1 overflow-y-auto focus-within:outline-none [&_.tiptap]:min-h-[320px] [&_.tiptap]:p-5 [&_.tiptap]:focus:outline-none"
      />
    </div>
  );
}
