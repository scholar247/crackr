import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { Suggestion, type SuggestionOptions } from '@tiptap/suggestion';
import type { Editor, Range } from '@tiptap/core';
import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ComponentType,
} from 'react';
import {
  Pilcrow,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  FileCode2,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Info,
  AlertTriangle,
  Lightbulb,
  OctagonAlert,
} from 'lucide-react';
import type { CalloutVariant } from './callout';

interface CommandItem {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  command: (props: { editor: Editor; range: Range }) => void;
}

const insertImage = (editor: Editor, range: Range) => {
  const src = window.prompt('Image URL:');
  if (!src) {
    editor.chain().focus().deleteRange(range).run();
    return;
  }
  const alt = window.prompt('Alt text (optional):') ?? '';
  editor.chain().focus().deleteRange(range).setImage({ src, alt }).run();
};

const CALLOUT_ITEMS: CommandItem[] = (
  [
    ['info', 'Info callout', Info],
    ['warning', 'Warning callout', AlertTriangle],
    ['tip', 'Tip callout', Lightbulb],
    ['danger', 'Danger callout', OctagonAlert],
  ] as [CalloutVariant, string, ComponentType<{ className?: string }>][]
).map(([variant, title, icon]) => ({
  title,
  description: `Highlighted ${variant} panel`,
  icon,
  command: ({ editor, range }: { editor: Editor; range: Range }) =>
    editor.chain().focus().deleteRange(range).setCallout({ variant }).run(),
}));

const COMMAND_ITEMS: CommandItem[] = [
  {
    title: 'Text',
    description: 'Plain paragraph',
    icon: Pilcrow,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: 'Heading 2',
    description: 'Section heading',
    icon: Heading2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Sub-section heading',
    icon: Heading3,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Heading 4',
    description: 'Minor heading',
    icon: Heading4,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 4 }).run(),
  },
  {
    title: 'Bullet list',
    description: 'Unordered list',
    icon: List,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    description: 'Ordered list',
    icon: ListOrdered,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    description: 'Blockquote',
    icon: Quote,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code block',
    description: 'Fenced code block',
    icon: FileCode2,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Table',
    description: '3x3 table with header row',
    icon: TableIcon,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Image',
    description: 'Embed an image by URL',
    icon: ImageIcon,
    command: ({ editor, range }) => insertImage(editor, range),
  },
  {
    title: 'Divider',
    description: 'Horizontal rule',
    icon: Minus,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  ...CALLOUT_ITEMS,
];

function filterItems(query: string): CommandItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return COMMAND_ITEMS;
  return COMMAND_ITEMS.filter(
    (item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
  );
}

interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

interface CommandListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const CommandList = forwardRef<CommandListHandle, CommandListProps>(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0);
  const [prevItems, setPrevItems] = useState(items);

  if (items !== prevItems) {
    setPrevItems(items);
    setSelected(0);
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowDown') {
        setSelected((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowUp') {
        setSelected((prev) => (prev - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return <div className="slash-menu-empty">No matching blocks</div>;
  }

  return (
    <div className="slash-menu">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={item.title}
            className={index === selected ? 'slash-menu-item is-selected' : 'slash-menu-item'}
            onMouseEnter={() => setSelected(index)}
            onClick={() => command(item)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="slash-menu-item-text">
              <span className="slash-menu-item-title">{item.title}</span>
              <span className="slash-menu-item-desc">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
CommandList.displayName = 'CommandList';

const suggestion: Omit<SuggestionOptions<CommandItem>, 'editor'> = {
  char: '/',
  startOfLine: false,
  items: ({ query }) => filterItems(query),
  render: () => {
    let component: ReactRenderer<CommandListHandle, CommandListProps>;
    let unmount: (() => void) | undefined;

    return {
      onStart: (props) => {
        component = new ReactRenderer(CommandList, {
          props: {
            items: props.items,
            command: (item: CommandItem) => item.command({ editor: props.editor, range: props.range }),
          },
          editor: props.editor,
        });
        unmount = props.mount(component.element);
      },
      onUpdate: (props) => {
        component.updateProps({
          items: props.items,
          command: (item: CommandItem) => item.command({ editor: props.editor, range: props.range }),
        });
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          unmount?.();
          component.destroy();
          return true;
        }
        return component.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        unmount?.();
        component.destroy();
      },
    };
  },
};

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return { suggestion };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
