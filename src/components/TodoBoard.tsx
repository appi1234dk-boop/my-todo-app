'use client';

import { useState, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Category, Todo } from '@/lib/types';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import TodoCard from './TodoCard';
import TodoFormModal from './TodoFormModal';

const supabase = createBrowserSupabaseClient();

// 새 카테고리 자동 색상 팔레트
const COLOR_PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  initialTodos: Todo[];
  categories: Category[];
}

export default function TodoBoard({ initialTodos, categories: initialCategories }: Props) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // 카테고리 추가 UI
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const newCatInputRef = useRef<HTMLInputElement>(null);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const today = getTodayStr();

  // Today = 미완료 중 마감일이 오늘
  const todayTodos = todos.filter((t) => !t.is_complete && t.due_date === today);
  const todayIds = new Set(todayTodos.map((t) => t.id));

  // 미완료 중 Today 제외 + 카테고리 필터
  const activeTodos = todos
    .filter((t) => !t.is_complete && !todayIds.has(t.id))
    .filter((t) =>
      filterCategoryId ? t.category_ids.includes(filterCategoryId) : true
    );

  // 완료 + 카테고리 필터
  const completedTodos = todos
    .filter((t) => t.is_complete)
    .filter((t) =>
      filterCategoryId ? t.category_ids.includes(filterCategoryId) : true
    );

  // ─── 완료 효과음 ─────────────────────────────────────
  function playDing() {
    const ctx = new AudioContext();

    function bell(freq: number, startTime: number, volume: number) {
      // 기본음 + 배음(2.76배) 조합으로 종소리 질감 구현
      [freq, freq * 2.76].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = f;
        const v = i === 0 ? volume : volume * 0.4;
        gain.gain.setValueAtTime(v, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });
    }

    // 올라가는 두 음: C6 → E6
    bell(1047, ctx.currentTime, 0.35);
    bell(1319, ctx.currentTime + 0.15, 0.28);
  }

  // ─── CRUD ───────────────────────────────────────────
  function handleToggle(id: string) {
    const todo = todos.find((t) => t.id === id)!;
    const newValue = !todo.is_complete;
    if (newValue) playDing();
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_complete: newValue } : t))
    );
    supabase.from('todos').update({ is_complete: newValue }).eq('id', id).then();
  }

  function handleDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
    supabase.from('todos').delete().eq('id', id).then();
  }

  async function handleAdd(todo: Todo) {
    setTodos((prev) => [...prev, todo]);
    const { error } = await supabase
      .from('todos')
      .insert({
        id: todo.id,
        title: todo.title,
        is_complete: todo.is_complete,
        due_date: todo.due_date,
        position: todo.position,
      });
    if (!error && todo.category_ids.length > 0) {
      await supabase.from('todo_categories').insert(
        todo.category_ids.map((cid) => ({ todo_id: todo.id, category_id: cid }))
      );
    }
  }

  async function handleEdit(updated: Todo) {
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    await supabase
      .from('todos')
      .update({
        title: updated.title,
        due_date: updated.due_date,
        updated_at: updated.updated_at,
      })
      .eq('id', updated.id);
    // 카테고리 재연결: 기존 삭제 후 재삽입
    await supabase.from('todo_categories').delete().eq('todo_id', updated.id);
    if (updated.category_ids.length > 0) {
      await supabase.from('todo_categories').insert(
        updated.category_ids.map((cid) => ({ todo_id: updated.id, category_id: cid }))
      );
    }
  }

  function handleDragEndToday(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTodos((prev) => {
      const activeIdx = prev.findIndex((t) => t.id === active.id);
      const overIdx = prev.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(prev, activeIdx, overIdx);
      syncPositions(reordered, [String(active.id), String(over.id)]);
      return reordered;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTodos((prev) => {
      const activeIdx = prev.findIndex((t) => t.id === active.id);
      const overIdx = prev.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(prev, activeIdx, overIdx);
      syncPositions(reordered, [String(active.id), String(over.id)]);
      return reordered;
    });
  }

  // 재정렬 후 변경된 두 항목의 position 업데이트
  function syncPositions(reordered: Todo[], changedIds: string[]) {
    changedIds.forEach((id, i) => {
      const idx = reordered.findIndex((t) => t.id === id);
      const newPos = idx * 1000 + i;
      supabase.from('todos').update({ position: newPos }).eq('id', id);
    });
  }

  // ─── 카테고리 관리 ───────────────────────────────────
  function handleDeleteCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTodos((prev) =>
      prev.map((t) => {
        if (!t.category_ids.includes(id)) return t;
        const newIds = t.category_ids.filter((cid) => cid !== id);
        const newCats = t.categories.filter((c) => c.id !== id);
        return { ...t, category_ids: newIds, categories: newCats };
      })
    );
    if (filterCategoryId === id) setFilterCategoryId(null);
    supabase.from('categories').delete().eq('id', id);
  }

  async function handleAddCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const usedColors = categories.map((c) => c.color);
    const nextColor =
      COLOR_PALETTE.find((c) => !usedColors.includes(c)) ??
      COLOR_PALETTE[categories.length % COLOR_PALETTE.length];
    const newCat: Category = {
      id: crypto.randomUUID(),
      name,
      color: nextColor,
    };
    setCategories((prev) => [...prev, newCat]);
    setNewCatName('');
    setAddingCategory(false);
    await supabase.from('categories').insert({ id: newCat.id, name: newCat.name, color: newCat.color });
  }

  // ─── 모달 ────────────────────────────────────────────
  function openEditModal(todo: Todo) {
    setEditingTodo(todo);
    setModalOpen(true);
  }

  function openAddModal() {
    setEditingTodo(null);
    setModalOpen(true);
  }

  // ─── 렌더 ────────────────────────────────────────────
  return (
    <>
      <div className="space-y-4">
        {/* ── Today 섹션 ── */}
        {todayTodos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">📅 오늘</span>
              <span className="text-xs text-slate-500 font-semibold">({todayTodos.length})</span>
              <span className="flex-1 h-px bg-slate-200" />
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndToday}
            >
              <SortableContext
                items={todayTodos.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {todayTodos.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={openEditModal}
                      isDeleting={deletingIds.has(todo.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        )}

        {/* ── 카테고리 필터 + 관리 ── */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setFilterCategoryId(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
              filterCategoryId === null
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            }`}
          >
            전체
          </button>

          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-0.5">
              <button
                onClick={() =>
                  setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)
                }
                className="px-3 py-1 rounded-full text-xs font-semibold border transition"
                style={
                  filterCategoryId === cat.id
                    ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color }
                    : {
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                        borderColor: `${cat.color}40`,
                      }
                }
              >
                {cat.name}
              </button>
              {/* 카테고리 삭제 버튼 */}
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="w-4 h-4 flex items-center justify-center rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition"
                aria-label={`${cat.name} 삭제`}
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* 카테고리 추가 */}
          {addingCategory ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddCategory(); }}
              className="flex items-center gap-1"
            >
              <input
                ref={newCatInputRef}
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="이름 입력"
                maxLength={20}
                className="w-24 px-2 py-0.5 rounded-full text-xs border border-slate-300 outline-none focus:border-indigo-400 bg-white"
              />
              <button
                type="submit"
                className="text-xs text-indigo-500 font-semibold px-1"
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => { setAddingCategory(false); setNewCatName(''); }}
                className="text-xs text-slate-400 px-1"
              >
                취소
              </button>
            </form>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition"
              aria-label="카테고리 추가"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* ── 미완료 목록 (드래그) ── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeTodos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {activeTodos.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  할 일이 없어요! 추가해보세요 ✨
                </div>
              ) : (
                activeTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                    isDeleting={deletingIds.has(todo.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* ── 완료 섹션 ── */}
        {completedTodos.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => setCompletedOpen((v) => !v)}
              className="w-full flex items-center gap-2 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${completedOpen ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              완료
              <span className="text-slate-300">({completedTodos.length})</span>
              <span className="flex-1 h-px bg-slate-200" />
            </button>

            {completedOpen && (
              <div className="space-y-1.5 mt-1">
                {completedTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={openEditModal}
                    isDeleting={deletingIds.has(todo.id)}
                    disableDrag
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 추가 버튼 ── */}
        <button
          onClick={openAddModal}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-3 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          할 일 추가
        </button>
      </div>

      {/* ── 추가/수정 모달 ── */}
      <TodoFormModal
        categories={categories}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        todo={editingTodo}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />
    </>
  );
}
