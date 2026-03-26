'use client';

import { useState, useEffect, useRef } from 'react';
import { Category, Todo } from '@/lib/types';

interface Props {
  categories: Category[];
  open: boolean;
  onClose: () => void;
  todo?: Todo | null;
  onAdd?: (todo: Todo) => void;
  onEdit?: (todo: Todo) => void;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TodoFormModal({
  categories,
  open,
  onClose,
  todo,
  onAdd,
  onEdit,
}: Props) {
  const isEdit = !!todo;

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Animation state machine
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState<'enter' | 'exit' | null>(null);
  const isMobileRef = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isMobileRef.current = window.matchMedia('(max-width: 639px)').matches;
  }, []);

  // open 변경 시 애니메이션 트리거
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setAnimating('enter'));
    } else {
      setAnimating('exit');
    }
  }, [open]);

  // exit 애니메이션 완료 후 unmount (데스크톱은 즉시)
  useEffect(() => {
    if (animating !== 'exit') return;
    if (!isMobileRef.current) {
      setMounted(false);
      setAnimating(null);
      return;
    }
    const id = setTimeout(() => {
      setMounted(false);
      setAnimating(null);
    }, 400);
    return () => clearTimeout(id);
  }, [animating]);

  // autoFocus: 모바일은 애니메이션 후 포커스, 데스크톱은 즉시
  useEffect(() => {
    if (!open) return;
    const delay = isMobileRef.current ? 360 : 0;
    const id = setTimeout(() => titleRef.current?.focus(), delay);
    return () => clearTimeout(id);
  }, [open]);

  // 폼 데이터 리셋
  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDueDate(todo.due_date ?? '');
      setSelectedIds(todo.category_ids);
    } else {
      setTitle('');
      setDueDate(getTodayStr());
      setSelectedIds([]);
    }
  }, [todo, open]);

  function handleAnimationEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (animating === 'exit') {
      setMounted(false);
      setAnimating(null);
    }
  }

  function toggleCategory(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedCategories = categories.filter((c) => selectedIds.includes(c.id));
    const now = new Date().toISOString();

    if (isEdit && todo && onEdit) {
      onEdit({
        ...todo,
        title: title.trim(),
        due_date: dueDate || null,
        category_ids: selectedIds,
        categories: selectedCategories,
        updated_at: now,
      });
    } else if (!isEdit && onAdd) {
      onAdd({
        id: crypto.randomUUID(),
        title: title.trim(),
        is_complete: false,
        due_date: dueDate || null,
        category_ids: selectedIds,
        categories: selectedCategories,
        position: Date.now(),
        created_at: now,
        updated_at: now,
      });
    }
    onClose();
  }

  if (!mounted) return null;

  const isMobile = isMobileRef.current;
  const sheetClass = isMobile
    ? animating === 'exit' ? 'sheet-exit' : 'sheet-enter'
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ height: '100dvh' }}
    >
      <div
        className={`absolute inset-0 bg-black/30 ${animating === 'exit' ? 'backdrop-exit' : 'backdrop-enter'}`}
        onClick={onClose}
      />

      <div
        className={`relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 p-6 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto ${sheetClass}`}
        onAnimationEnd={handleAnimationEnd}
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {/* 모바일 드래그 핸들 */}
        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5 sm:hidden" />

        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-5">
          {isEdit ? '할 일 수정' : '새 할 일 추가'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wide">
              제목 <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              maxLength={500}
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
            />
          </div>

          {/* 마감일 */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wide">
              마감일
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"
            />
          </div>

          {/* 카테고리 (다중 선택) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wide">
              카테고리 <span className="text-slate-300 font-normal normal-case">(복수 선택 가능)</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => {
                const selected = selectedIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
                    style={
                      selected
                        ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color }
                        : {
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                            borderColor: `${cat.color}40`,
                          }
                    }
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {cat.name}
                  </button>
                );
              })}
              {categories.length === 0 && (
                <p className="text-xs text-slate-400">카테고리가 없어요. 목록 화면에서 추가해주세요.</p>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition"
              style={{ backgroundColor: '#6366f1' }}
            >
              {isEdit ? '수정하기' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
