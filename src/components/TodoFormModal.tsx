'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDueDate(todo.due_date ?? '');
      setSelectedIds(todo.category_ids);
    } else {
      setTitle('');
      setDueDate(getTodayStr()); // 추가 모드: 오늘 날짜 기본값
      setSelectedIds([]);
    }
  }, [todo, open]);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 pb-8 sm:pb-6">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />

        <h2 className="text-base font-bold text-slate-800 mb-5">
          {isEdit ? '할 일 수정' : '새 할 일 추가'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일을 입력하세요"
              maxLength={500}
              required
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          {/* 마감일 */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              마감일
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          {/* 카테고리 (다중 선택) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
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
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition"
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
