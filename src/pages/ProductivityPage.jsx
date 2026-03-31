import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, ListTodo, Plus, Rocket, Sparkles, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createNote } from '../features/notes/notesSlice';
import {
  addGoal,
  completeFocusSession,
  removeGoal,
  setFocusPreset,
  toggleGoal,
  updateFocusDuration,
} from '../features/productivity/productivitySlice';

const presetLabels = {
  focus: 'Odak',
  shortBreak: 'Kisa Mola',
  longBreak: 'Uzun Mola',
};

function ProductivityPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.notes);
  const { focusPreset, focusDurations, goals, templates, totalFocusSessions } = useSelector(
    (state) => state.productivity,
  );
  const activeDuration = focusDurations[focusPreset] * 60;
  const [secondsLeft, setSecondsLeft] = useState(activeDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    if (!isRunning) return undefined;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          if (focusPreset === 'focus') {
            dispatch(completeFocusSession());
            toast.success('Odak seansi tamamlandi');
          } else {
            toast.success('Mola tamamlandi');
          }
          return activeDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeDuration, dispatch, focusPreset, isRunning]);

  const stats = useMemo(() => {
    const active = items.filter((item) => !item.isDeleted);
    const tagged = active.filter((item) => item.tags?.length > 0).length;
    const wordCount = active.reduce((sum, note) => {
      const plain = (note.content || '').replace(/<[^>]+>/g, ' ');
      const words = plain
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean);
      return sum + words.length;
    }, 0);

    return {
      activeCount: active.length,
      taggedRate: active.length ? Math.round((tagged / active.length) * 100) : 0,
      wordCount,
    };
  }, [items]);

  const completedGoals = goals.filter((goal) => goal.done).length;
  const completionRate = goals.length ? Math.round((completedGoals / goals.length) * 100) : 0;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  const handleTemplateCreate = async (template) => {
    try {
      const created = await dispatch(
        createNote({
          title: template.title,
          content: template.content,
          color: template.color,
          tags: template.tags,
          pinned: false,
        }),
      ).unwrap();
      toast.success(`${template.name} olusturuldu`);
      navigate(`/notes/${created._id}`);
    } catch {
      toast.error('Sablon olusturulamadi');
    }
  };

  const handleAddGoal = () => {
    if (!goalInput.trim()) return;
    dispatch(addGoal(goalInput));
    setGoalInput('');
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.28),_transparent_38%),linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(2,6,23,0.98))] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-indigo-300">Üretkenlik Merkezi</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Odak, hedef ve hizli not akisi tek ekranda</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                Bu alan local state ile calisir; timer, hedef takibi ve sablonlardan tek tikla not uretimi sunar.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Bugunku ilerleme</p>
              <p className="mt-2 text-3xl font-semibold text-white">%{completionRate}</p>
              <p className="text-sm text-slate-400">{completedGoals} / {goals.length} hedef tamamlandi</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock3 size={16} />
                Toplam odak seansi
              </div>
              <p className="mt-2 text-3xl font-semibold text-white">{totalFocusSessions}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Sparkles size={16} />
                Aktif notlar
              </div>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.activeCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Rocket size={16} />
                Etiket kapsami
              </div>
              <p className="mt-2 text-3xl font-semibold text-white">%{stats.taggedRate}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Odak sayacı</p>
              <h3 className="text-xl font-semibold text-white">{presetLabels[focusPreset]}</h3>
            </div>
            <div className="text-right">
              <p className="font-mono text-5xl font-semibold text-white">{minutes}:{seconds}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">Pomodoro</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(presetLabels).map(([key, label]) => (
              <button
                key={key}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  focusPreset === key ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                onClick={() => {
                  dispatch(setFocusPreset(key));
                  setIsRunning(false);
                  setSecondsLeft(focusDurations[key] * 60);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {Object.entries(focusDurations).map(([key, value]) => (
              <label key={key} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                <span className="mb-2 block">{presetLabels[key]} (dk)</span>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={value}
                  onChange={(event) => dispatch(updateFocusDuration({ key, value: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <button
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
              onClick={() => setIsRunning(true)}
            >
              Baslat
            </button>
            <button
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              onClick={() => setIsRunning(false)}
            >
              Duraklat
            </button>
            <button
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(activeDuration);
              }}
            >
              Sifirla
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Akilli sablonlar</p>
              <h3 className="text-xl font-semibold text-white">Tek tikla profesyonel not olustur</h3>
            </div>
            <div className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
              {templates.length} preset
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {templates.map((template) => (
              <div key={template.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="font-semibold text-white">{template.name}</h4>
                <p className="mt-2 min-h-12 text-sm text-slate-400">{template.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button
                  className="mt-4 w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
                  onClick={() => handleTemplateCreate(template)}
                >
                  Bu sablonla not olustur
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center gap-2">
            <ListTodo size={18} className="text-indigo-300" />
            <div>
              <p className="text-sm text-slate-400">Gunluk hedefler</p>
              <h3 className="text-xl font-semibold text-white">Günlük görev panosu</h3>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              placeholder="Yeni hedef ekle"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
              onClick={handleAddGoal}
            >
              <Plus size={16} />
              Ekle
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                <button
                  className="flex items-center gap-3 text-left"
                  onClick={() => dispatch(toggleGoal(goal.id))}
                >
                  <CheckCircle2
                    size={18}
                    className={goal.done ? 'text-emerald-400' : 'text-slate-600'}
                  />
                  <span className={goal.done ? 'text-slate-400 line-through' : 'text-slate-100'}>{goal.label}</span>
                </button>
                <button
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  onClick={() => dispatch(removeGoal(goal.id))}
                  title="Hedefi sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Yazi hacmi</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.wordCount} kelime</p>
            <p className="mt-1 text-sm text-slate-500">Tum aktif notlardaki toplam icerik hacmi.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProductivityPage;
