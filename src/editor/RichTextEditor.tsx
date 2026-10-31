import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react';

const ALIGNMENTS = [
  { id: 'left', label: 'Align left', icon: <AlignLeft size={15} /> },
  { id: 'center', label: 'Align center', icon: <AlignCenter size={15} /> },
  { id: 'right', label: 'Align right', icon: <AlignRight size={15} /> },
  { id: 'justify', label: 'Justify', icon: <AlignJustify size={15} /> },
] as const;

/** Relative sizes (em) so text keeps scaling with the CV font size and section text size. */
const FONT_SIZES = [
  { value: '', label: 'Normal' },
  { value: '0.8em', label: '80%' },
  { value: '0.9em', label: '90%' },
  { value: '1.1em', label: '110%' },
  { value: '1.2em', label: '120%' },
  { value: '1.4em', label: '140%' },
];

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 90 }: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      TextAlign.configure({ types: ['paragraph'] }),
      TextStyle,
      FontSize,
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'rte-content', 'data-placeholder': placeholder ?? '' },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChangeRef.current(html);
    },
  });

  // Sync when the value is replaced from outside (not while the user is typing here).
  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editor.isEmpty ? '' : editor.getHTML();
    if ((value || '') !== current) editor.commands.setContent(value || '', { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;
  return (
    <div className="rte">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className={editor.isEmpty ? 'rte-body is-empty' : 'rte-body'} style={{ minHeight }} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const [href, setHref] = useState('');
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      link: e.isActive('link'),
      left: e.isActive({ textAlign: 'left' }),
      center: e.isActive({ textAlign: 'center' }),
      right: e.isActive({ textAlign: 'right' }),
      justify: e.isActive({ textAlign: 'justify' }),
      fontSize: (e.getAttributes('textStyle').fontSize as string | undefined) ?? '',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();
  const currentAlign = ALIGNMENTS.find((a) => state[a.id]) ?? ALIGNMENTS[0];

  const openLink = () => {
    setHref((editor.getAttributes('link').href as string | undefined) ?? '');
    setLinkOpen(true);
  };
  const applyLink = () => {
    const url = href.trim();
    if (!url) chain().extendMarkRange('link').unsetLink().run();
    else chain().extendMarkRange('link').setLink({ href: url }).run();
    setLinkOpen(false);
  };

  const btn = (active: boolean, onClick: () => void, label: string, icon: React.ReactNode, disabled = false) => (
    <button
      key={label}
      type="button"
      className={`rte-btn${active ? ' is-active' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
    >
      {icon}
    </button>
  );

  return (
    <div className="rte-toolbar">
      {btn(state.bold, () => chain().toggleBold().run(), 'Bold (Ctrl+B)', <Bold size={15} />)}
      {btn(state.italic, () => chain().toggleItalic().run(), 'Italic (Ctrl+I)', <Italic size={15} />)}
      {btn(state.underline, () => chain().toggleUnderline().run(), 'Underline (Ctrl+U)', <Underline size={15} />)}
      {btn(state.strike, () => chain().toggleStrike().run(), 'Strikethrough', <Strikethrough size={15} />)}
      <span className="rte-sep" />
      <select
        className="rte-size"
        title="Font size"
        aria-label="Font size"
        value={FONT_SIZES.some((f) => f.value === state.fontSize) ? state.fontSize : 'custom'}
        onChange={(e) => {
          const size = e.target.value;
          if (size) chain().setFontSize(size).run();
          else chain().unsetFontSize().run();
        }}
      >
        {FONT_SIZES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
        {!FONT_SIZES.some((f) => f.value === state.fontSize) && <option value="custom">{state.fontSize}</option>}
      </select>
      <span className="rte-sep" />
      {btn(state.bullet, () => chain().toggleBulletList().run(), 'Bullet list', <List size={15} />)}
      {btn(state.ordered, () => chain().toggleOrderedList().run(), 'Numbered list', <ListOrdered size={15} />)}
      <span className="rte-sep" />
      <span className="rte-align">
        {btn(alignOpen, () => setAlignOpen((o) => !o), 'Text alignment', currentAlign.icon)}
        {alignOpen && (
          <span className="rte-align-menu">
            {ALIGNMENTS.map((a) =>
              btn(state[a.id], () => {
                chain().setTextAlign(a.id).run();
                setAlignOpen(false);
              }, a.label, a.icon),
            )}
          </span>
        )}
      </span>
      <span className="rte-sep" />
      {btn(state.link, openLink, 'Add link', <Link2 size={15} />)}
      {state.link && btn(false, () => chain().extendMarkRange('link').unsetLink().run(), 'Remove link', <Unlink size={15} />)}
      {btn(false, () => chain().unsetAllMarks().clearNodes().unsetTextAlign().run(), 'Clear formatting', <RemoveFormatting size={15} />)}
      <span className="rte-spacer" />
      {btn(false, () => chain().undo().run(), 'Undo (Ctrl+Z)', <Undo2 size={15} />, !state.canUndo)}
      {btn(false, () => chain().redo().run(), 'Redo (Ctrl+Y)', <Redo2 size={15} />, !state.canRedo)}
      {linkOpen && (
        <div className="rte-link">
          <input
            autoFocus
            type="url"
            placeholder="https://…"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') setLinkOpen(false);
            }}
          />
          <button type="button" className="btn btn--sm btn--primary" onClick={applyLink}>
            Apply
          </button>
          <button type="button" className="btn btn--sm" onClick={() => setLinkOpen(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
