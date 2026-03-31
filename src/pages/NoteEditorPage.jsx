import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createNote, updateNote } from '../features/notes/notesSlice';
import API from '../services/api';
import toast from 'react-hot-toast';

const colors = ['slate', 'rose', 'amber', 'emerald', 'sky', 'violet'];
const colorHex = {
  slate: '#334155',
  rose: '#e11d48',
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
};

function NoteEditorPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { accessToken } = useSelector((state) => state.auth);

  const isEditing = Boolean(id);
  const editorRef = useRef(null);
  const initialHtmlSetRef = useRef(false);
  const initKeyRef = useRef(null);
  const skipLoadToastRef = useRef(Boolean(location.state?.skipLoadToast));
  const selectionRangeRef = useRef(null);

  const [title, setTitle] = useState(isEditing ? '' : '');
  const [noteColor, setNoteColor] = useState('slate');
  const [noteId, setNoteId] = useState(isEditing ? id : null);
  const [contentHtml, setContentHtml] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [textColor, setTextColor] = useState('#e2e8f0');
  const [bgColor, setBgColor] = useState('#020617');
  const [fontSize, setFontSize] = useState('14'); // UI: px, execCommand: mapped

  const saveSelection = () => {
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0) return;
    if (!editorRef.current) return;
    if (!editorRef.current.contains(selection.anchorNode)) return;
    selectionRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const range = selectionRangeRef.current;
    const selection = window.getSelection?.();
    if (!selection) return;
    if (!range) return;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const getSelectedHtml = (range) => {
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    return container.innerHTML;
  };

  const splitHtmlIntoLines = (html) => {
    // Regex tabanlı dönüşüm bazı tarayıcılarda selection fragment'lerinde newline kaçırabiliyor.
    // Bu yüzden DOM üzerinden yürüyerek <br> ve blok elementleri newline olarak işliyoruz.
    const root = document.createElement('div');
    root.innerHTML = html || '';

    const blockTags = new Set([
      'DIV',
      'P',
      'LI',
      'H1',
      'H2',
      'H3',
      'H4',
      'H5',
      'H6',
      'BLOCKQUOTE',
      'PRE',
      'UL',
      'OL',
    ]);

    let out = '';
    const walk = (node) => {
      if (!node) return;
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.nodeValue || '';
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node;
      const tag = el.tagName;

      if (tag === 'BR') {
        out += '\n';
        return;
      }

      const isBlock = blockTags.has(tag);
      if (isBlock) out += '\n';

      for (const child of Array.from(el.childNodes)) walk(child);

      if (isBlock) out += '\n';
    };

    for (const child of Array.from(root.childNodes)) walk(child);

    return out
      .replace(/\u00A0/g, ' ')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const getLinesFromRange = (range) => {
    if (!range) return [];

    // En güvenilir yol: seçili içeriğin klon HTML'inden satırları üretmek.
    // Bu yöntem <br> gibi görsel satır kırılımlarını da yakalar.
    const selectedHtml = getSelectedHtml(range);
    const parsedFromHtml = splitHtmlIntoLines(selectedHtml);
    if (parsedFromHtml.length > 0) return parsedFromHtml;

    const direct = (range.toString?.() || '').trim();
    if (direct.includes('\n')) {
      return direct
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    }

    const root = editorRef.current;
    if (!root) return direct ? [direct] : [];

    const blocks = Array.from(root.querySelectorAll('div, p, li, h1, h2, h3, h4, h5, h6, blockquote, pre'));
    const hit = [];

    // Seçim farklı blokları kapsıyorsa, her bloğu ayrı satır(lar) olarak al.
    for (const el of blocks) {
      try {
        if (!range.intersectsNode(el)) continue;
      } catch {
        continue;
      }
      const t = (el.innerText || '').trim();
      if (!t) continue;
      t.split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((l) => hit.push(l));
    }

    if (hit.length > 0) return hit;

    return direct ? [direct] : [];
  };

  const wrapLiContent = (li) => {
    if (!li) return;
    // Zaten sarmalanmışsa dokunma
    const existing = li.querySelector(':scope > .li-content');
    if (existing) return;

    const wrapper = document.createElement('span');
    wrapper.className = 'li-content';

    // Child node'ları iki gruba ayır: nested listler ve diğer içerik
    const children = Array.from(li.childNodes);
    children.forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.tagName === 'OL' || node.tagName === 'UL')
      ) {
        return;
      }
      wrapper.appendChild(node);
    });

    // wrapper boşsa (ör. sadece nested list varsa), br ekle
    if (wrapper.childNodes.length === 0) {
      wrapper.appendChild(document.createElement('br'));
    }

    // wrapper'ı nested listlerden önce ekle
    const firstNested = li.querySelector(':scope > ol, :scope > ul');
    if (firstNested) {
      li.insertBefore(wrapper, firstNested);
    } else {
      li.appendChild(wrapper);
    }
  };

  const insertListFromRange = (range, ordered) => {
    const selection = window.getSelection?.();
    if (!selection) return false;
    if (!range) return false;
    if (!editorRef.current || !editorRef.current.contains(range.commonAncestorContainer)) return false;

    const listEl = document.createElement(ordered ? 'ol' : 'ul');
    listEl.style.paddingLeft = '1.25rem';
    listEl.style.margin = '0.25rem 0';
    // Tailwind preflight list-style'ı sıfırladığı için işaretleri elle set ediyoruz.
    listEl.style.listStylePosition = 'outside';
    listEl.style.listStyleType = ordered ? 'decimal' : 'disc';

    const lines = range.collapsed ? [] : getLinesFromRange(range);

    if (lines.length === 0) {
      const li = document.createElement('li');
      li.style.margin = '0.125rem 0';
      li.appendChild(document.createElement('br'));
      wrapLiContent(li);
      listEl.appendChild(li);
    } else {
      lines.forEach((line) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.className = 'li-content';
        span.textContent = line;
        li.appendChild(span);
        li.style.margin = '0.125rem 0';
        wrapLiContent(li);
        listEl.appendChild(li);
      });
    }

    if (!range.collapsed) {
      range.deleteContents();
    }
    range.insertNode(listEl);

    const lastLi = listEl.lastElementChild;
    if (lastLi) {
      const newRange = document.createRange();
      newRange.selectNodeContents(lastLi);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      selectionRangeRef.current = newRange.cloneRange();
    }

    return true;
  };

  const insertListFromSelection = (ordered) => {
    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    return insertListFromRange(range, ordered);
  };

  const applyList = (ordered) => {
    // Liste işlemlerinde execCommand yerine her zaman kendi dönüşümümüzü kullan.
    // Böylece "1." / "•" her zaman satırları listeye çevirir.
    if (!selectionRangeRef.current) saveSelection();
    if (editorRef.current) editorRef.current.focus();

    // Toolbar tıklaması seçimi çökertse bile, bizim kaydettiğimiz range ile dönüşümü yap.
    const saved = selectionRangeRef.current?.cloneRange?.();
    const ok = saved ? insertListFromRange(saved, ordered) : insertListFromSelection(ordered);
    if (ok && editorRef.current) {
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const createListEl = (tagName) => {
    const el = document.createElement(tagName);
    el.style.paddingLeft = '1.25rem';
    el.style.margin = '0.25rem 0';
    el.style.listStylePosition = 'outside';
    if (tagName.toLowerCase() === 'ol') el.style.listStyleType = 'decimal';
    if (tagName.toLowerCase() === 'ul') el.style.listStyleType = 'disc';
    return el;
  };

  const convertListTypeForRange = (range, targetTag /* 'ol' | 'ul' */) => {
    if (!editorRef.current) return false;
    if (!range) return false;

    const startEl =
      range.startContainer?.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer?.parentElement;
    if (!startEl) return false;

    const list = startEl.closest?.('ol,ul');
    if (!list || !editorRef.current.contains(list)) return false;

    const fromTag = list.tagName.toLowerCase();
    const toTag = targetTag.toLowerCase();
    if (fromTag === toTag) return false;

    const lis = Array.from(list.querySelectorAll(':scope > li'));
    const selectedLis = lis.filter((li) => {
      try {
        return range.intersectsNode(li);
      } catch {
        return false;
      }
    });
    if (selectedLis.length === 0) return false;

    const firstIdx = lis.indexOf(selectedLis[0]);
    const lastIdx = lis.indexOf(selectedLis[selectedLis.length - 1]);

    const before = lis.slice(0, firstIdx);
    const middle = lis.slice(firstIdx, lastIdx + 1);
    const after = lis.slice(lastIdx + 1);

    const parent = list.parentNode;
    if (!parent) return false;

    const insertBefore = list;

    if (before.length > 0) {
      const beforeList = createListEl(fromTag);
      before.forEach((li) => beforeList.appendChild(li));
      parent.insertBefore(beforeList, insertBefore);
    }

    const midList = createListEl(toTag);
    middle.forEach((li) => {
      wrapLiContent(li);
      midList.appendChild(li);
    });
    parent.insertBefore(midList, insertBefore);

    if (after.length > 0) {
      const afterList = createListEl(fromTag);
      after.forEach((li) => {
        wrapLiContent(li);
        afterList.appendChild(li);
      });
      parent.insertBefore(afterList, insertBefore);
    }

    list.remove();

    // caret'i dönüştürülen listenin sonuna al
    const last = midList.lastElementChild;
    if (last) placeCaretAtEnd(last);

    return true;
  };

  const toggleList = (ordered) => {
    if (!editorRef.current) return;
    if (!selectionRangeRef.current) saveSelection();
    if (editorRef.current) editorRef.current.focus();

    const range = selectionRangeRef.current?.cloneRange?.();
    if (!range) {
      applyList(ordered);
      return;
    }

    // Önce: eğer başka tipte bir listenin içindeysek, seçili maddeleri dönüştür.
    const converted = convertListTypeForRange(range, ordered ? 'ol' : 'ul');
    if (converted) {
      setContentHtml(editorRef.current.innerHTML);
      return;
    }

    // İmleç/seçim aynı tipte bir listenin içindeyse, o listeyi kaldır.
    const startEl =
      range.startContainer?.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer?.parentElement;
    const listEl = startEl?.closest?.(ordered ? 'ol' : 'ul');

    if (listEl && editorRef.current.contains(listEl)) {
      const items = Array.from(listEl.querySelectorAll(':scope > li'));
      const frag = document.createDocumentFragment();
      items.forEach((li) => {
        const div = document.createElement('div');
        // İçeriği koru (bold/italic vs.)
        div.innerHTML = li.innerHTML || '';
        frag.appendChild(div);
      });

      listEl.replaceWith(frag);

      // HTML state güncelle
      setContentHtml(editorRef.current.innerHTML);
      return;
    }

    // Liste içinde değilse, normal şekilde uygula.
    applyList(ordered);
  };

  const format = (cmd, value) => {
    // Not: liste işlemleri applyList ile yönetiliyor.
    // Diğer komutlarda (B, I, U, font, renk...) son kaydedilen seçimi geri yükle.
    if (!selectionRangeRef.current) saveSelection();
    if (editorRef.current) editorRef.current.focus();
    restoreSelection();

    // Daha stabil CSS formatlama için
    document.execCommand('styleWithCSS', false, true);

    // contenteditable içinde seçim varsa execCommand uygulanır.
    document.execCommand(cmd, false, value);

    // Kullanıcı aksiyonundan sonra güncel HTML'i çekiyoruz.
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContentHtml(html);
  };

  const palette = useMemo(() => colors, []);

  useEffect(() => {
    document.execCommand('styleWithCSS', false, true);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    // React StrictMode (dev) useEffect'i iki kez tetikleyebilir.
    // Aynı sayfa için tekrar çalışmayı engelliyoruz.
    const key = `${isEditing ? 'edit' : 'new'}:${id || 'new'}`;
    if (initKeyRef.current === key) return;
    initKeyRef.current = key;

    if (isEditing && id) {
      (async () => {
        try {
          setLoading(true);
          const { data } = await API.get(`/notes/${id}`);
          const note = data.note;

          setTitle(note.title || '');
          setNoteColor(note.color || 'slate');
          setContentHtml(note.content || '');
          setNoteId(note._id);

          // "Not yüklendi" toast'ını bilinçli olarak göstermiyoruz.
          // Kullanıcı Kaydet'e bastığında tek bildirim görsün.
          skipLoadToastRef.current = false;
        } catch {
          toast.error('Not yüklenemedi');
          navigate('/notes');
        } finally {
          setLoading(false);
        }
      })();
    } else {
      // Yeni not ekranında DB kaydı "Kaydet" ile yapılacak.
    }
  }, [accessToken, dispatch, id, isEditing, navigate]);

  useEffect(() => {
    if (!noteId) return;
    if (!editorRef.current) return;
    if (initialHtmlSetRef.current) return;

    editorRef.current.innerHTML = contentHtml || '';
    initialHtmlSetRef.current = true;
  }, [contentHtml, noteId]);

  const onEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContentHtml(html);
  };

  const placeCaretAtEnd = (el) => {
    const selection = window.getSelection?.();
    if (!selection || !el) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    selection.removeAllRanges();
    selection.addRange(r);
    selectionRangeRef.current = r.cloneRange();
  };

  const handleEditorKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    if (!editorRef.current) return;

    const selection = window.getSelection?.();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const startEl =
      range.startContainer?.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer?.parentElement;
    if (!startEl) return;

    const li = startEl.closest?.('li');
    if (!li) return;

    const parentList = li.parentElement;
    if (!parentList || (parentList.tagName !== 'OL' && parentList.tagName !== 'UL')) return;

    e.preventDefault();

    const isOutdent = e.shiftKey;

    if (!isOutdent) {
      // Indent: mevcut li'yi bir önceki li'nin altına (nested list) taşı.
      const prev = li.previousElementSibling;
      if (!prev || prev.tagName !== 'LI') return;

      const listTag = parentList.tagName; // OL veya UL aynı tipte nested olsun
      let sub = Array.from(prev.children).find((c) => c.tagName === listTag);
      if (!sub) {
        sub = document.createElement(listTag.toLowerCase());
        sub.style.paddingLeft = '1.25rem';
        sub.style.margin = '0.25rem 0';
        sub.style.listStylePosition = 'outside';
        sub.style.listStyleType = listTag === 'OL' ? 'decimal' : 'disc';
        prev.appendChild(sub);
      }

      sub.appendChild(li);
      placeCaretAtEnd(li);
      setContentHtml(editorRef.current.innerHTML);
      return;
    }

    // Outdent (Shift+Tab): nested list içindeyse bir üst listeye çıkar.
    const parentLi = parentList.closest?.('li');
    const grandList = parentLi?.parentElement;
    if (!parentLi || !grandList || (grandList.tagName !== 'OL' && grandList.tagName !== 'UL')) return;

    // parentLi'nin hemen sonrasına koy
    if (parentLi.nextSibling) {
      grandList.insertBefore(li, parentLi.nextSibling);
    } else {
      grandList.appendChild(li);
    }

    // Eğer parentList boş kaldıysa temizle
    if (parentList.children.length === 0) {
      parentList.remove();
    }

    placeCaretAtEnd(li);
    setContentHtml(editorRef.current.innerHTML);
  };

  const applyTextColor = (color) => {
    setTextColor(color);
    format('foreColor', color);
  };

  const applyBackgroundColor = (color) => {
    setBgColor(color);
    // `hiliteColor` modern; bazı browserlarda `backColor` gerekebilir
    try {
      format('hiliteColor', color);
    } catch {
      format('backColor', color);
    }
  };

  const fontSizeMap = {
    11: '2',
    12: '2',
    13: '3',
    14: '3',
    16: '4',
    18: '4',
    20: '5',
    22: '6',
    24: '7',
  };

  const applyFontSize = (px) => {
    setFontSize(px);
    const mapped = fontSizeMap[px] || '3';
    format('fontSize', mapped);
  };

  const onTitleChange = (value) => {
    setTitle(value);
  };

  const handleSave = async () => {
    const html = editorRef.current?.innerHTML ?? contentHtml;
    setSaving(true);
    try {
      if (!noteId) {
        const created = await dispatch(
          createNote({
            title: title?.trim() || 'Başlıksız',
            content: html || '',
            color: noteColor,
            tags: [],
            pinned: false,
          }),
        ).unwrap();
        setNoteId(created._id);
        toast.success('Not kaydedildi', { id: 'note-save' });
        navigate('/notes', { replace: true });
        return;
      }

      await dispatch(
        updateNote({
          id: noteId,
          payload: { title: title?.trim() || 'Başlıksız', content: html, color: noteColor },
        }),
      ).unwrap();
      toast.success('Not kaydedildi', { id: 'note-save' });
      navigate('/notes', { replace: true });
    } catch {
      toast.error('Kaydetme başarısız', { id: 'note-save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-[calc(100vh-50px)] flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="flex h-9 w-9 items-center justify-center rounded bg-slate-800 text-sm font-bold text-slate-100 transition hover:bg-slate-700"
              onMouseDown={(e) => {
                e.preventDefault();
                format('bold');
              }}
            >
              B
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded bg-slate-800 text-sm font-medium text-slate-100 italic transition hover:bg-slate-700"
              onMouseDown={(e) => {
                e.preventDefault();
                format('italic');
              }}
            >
              I
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded bg-slate-800 text-sm font-semibold text-slate-100 underline transition hover:bg-slate-700"
              onMouseDown={(e) => {
                e.preventDefault();
                format('underline');
              }}
            >
              U
            </button>

            <button
              className="flex h-9 items-center justify-center rounded bg-slate-800 px-2 text-sm text-slate-100 transition hover:bg-slate-700"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                toggleList(false);
              }}
              title="Madde işaretli liste"
            >
              •
            </button>
            <button
              className="flex h-9 items-center justify-center rounded bg-slate-800 px-2 text-sm text-slate-100 transition hover:bg-slate-700"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                toggleList(true);
              }}
              title="Numaralı liste"
            >
              1.
            </button>

            <select
              className="h-9 rounded bg-slate-800 px-2 text-sm text-slate-100"
              value={fontSize}
              onChange={(e) => applyFontSize(e.target.value)}
              title="Yazı boyutu"
            >
              <option value="11">11</option>
              <option value="12">12</option>
              <option value="13">13</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="22">22</option>
              <option value="24">24</option>
            </select>

          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="mr-1 text-xs text-slate-300">Not rengi:</span>
              {palette.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => setNoteColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    noteColor === c ? 'border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: colorHex[c] }}
                />
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-slate-300">Yazı rengi:</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => applyTextColor(e.target.value)}
                title="Yazı rengi"
                className="h-8 w-9 cursor-pointer rounded bg-slate-800 p-1"
              />
              <span className="ml-2 text-xs text-slate-300">Metin arka planı:</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => applyBackgroundColor(e.target.value)}
                title="Metin arka planı"
                className="h-8 w-9 cursor-pointer rounded bg-slate-800 p-1"
              />
            </div>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="mt-3 w-full bg-transparent text-2xl font-semibold outline-none"
          placeholder="Başlık yaz..."
        />

        <div
          ref={editorRef}
          onInput={onEditorInput}
          onKeyDown={handleEditorKeyDown}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onFocus={saveSelection}
          contentEditable
          suppressContentEditableWarning
          className="rich-editor mt-3 flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm outline-none"
        />

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteEditorPage;
