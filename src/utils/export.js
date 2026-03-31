const htmlToText = (html) => {
  if (!html) return '';
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
};

const safeFilePart = (value) =>
  String(value || '')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80) || 'notes';

export const buildNotesJsonExport = (notes) => {
  const payload = (notes || []).map((note) => ({
    id: note._id,
    title: note.title || '',
    tags: note.tags || [],
    color: note.color || 'slate',
    pinned: Boolean(note.pinned),
    isDeleted: Boolean(note.isDeleted),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    lastEditedAt: note.lastEditedAt,
    deletedAt: note.deletedAt,
    contentHtml: note.content || '',
    contentText: htmlToText(note.content || ''),
  }));

  return {
    exportedAt: new Date().toISOString(),
    count: payload.length,
    notes: payload,
  };
};

export const buildNotesMarkdownExport = (notes) => {
  const items = notes || [];
  const blocks = items.map((note) => {
    const title = note.title?.trim() || 'Başlıksız';
    const tags = (note.tags || []).map((t) => `#${t}`).join(' ');
    const updated = note.lastEditedAt || note.updatedAt || note.createdAt;
    const text = htmlToText(note.content || '');
    return [
      `# ${title}`,
      tags ? `\n${tags}` : '',
      updated ? `\n_Güncelleme: ${new Date(updated).toLocaleString('tr-TR')}_` : '',
      `\n\n${text || ''}`,
      '\n\n---\n',
    ]
      .filter(Boolean)
      .join('');
  });

  return blocks.join('\n').trim() + '\n';
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const downloadNotesJson = (notes, filenameBase = 'notes-export') => {
  const payload = buildNotesJsonExport(notes);
  const filename = `${safeFilePart(filenameBase)}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, filename);
};

export const downloadNotesMarkdown = (notes, filenameBase = 'notes-export') => {
  const md = buildNotesMarkdownExport(notes);
  const filename = `${safeFilePart(filenameBase)}.md`;
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, filename);
};

