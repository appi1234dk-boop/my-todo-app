'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Todo } from '@/lib/types';

interface Props {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  isDeleting?: boolean;
  /** 완료 섹션 카드는 드래그 비활성화 */
  disableDrag?: boolean;
}

function getDateDisplay(dueDate: string | null): { date: string; isPast: boolean } | null {
  if (!dueDate) return null;
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { date: dueDate, isPast: dueDate < todayStr };
}

export default function TodoCard({
  todo,
  onToggle,
  onDelete,
  onEdit,
  isDeleting = false,
  disableDrag = false,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: todo.id, disabled: disableDrag || isDeleting });

  const dndStyle = isDeleting ? {} : {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const deleteStyle = isDeleting
    ? { animation: 'slide-out-left 0.3s ease forwards', overflow: 'hidden' }
    : {};

  const dateDisplay = getDateDisplay(todo.due_date);

  return (
    <div
      ref={setNodeRef}
      style={{ ...dndStyle, ...deleteStyle }}
      className={`group flex items-center gap-2 rounded-2xl px-3 py-3 bg-white dark:bg-slate-800 ${
        isDragging ? 'ring-2 ring-indigo-300 dark:ring-indigo-600' : ''
      }`}
    >
      {/* 드래그 핸들 */}
      {!disableDrag ? (
        <button
          {...attributes}
          {...listeners}
          suppressHydrationWarning
          className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors touch-none"
          aria-label="순서 변경"
          tabIndex={-1}
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="11" cy="4" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="11" cy="12" r="1.2" />
          </svg>
        </button>
      ) : (
        <div className="w-6 flex-shrink-0" />
      )}

      {/* 체크박스 */}
      <button
        onClick={() => onToggle(todo.id)}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
        style={{
          borderColor: todo.is_complete
            ? (todo.categories[0]?.color ?? '#10b981')
            : '#cbd5e1',
          backgroundColor: todo.is_complete
            ? (todo.categories[0]?.color ?? '#10b981')
            : 'transparent',
        }}
        aria-label={todo.is_complete ? '미완료로 변경' : '완료로 변경'}
      >
        {todo.is_complete && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* 본문 — 클릭 시 수정 모달 */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => !isDeleting && onEdit(todo)}
      >
        {/* 제목 */}
        <span
          className={`block text-sm font-medium leading-snug truncate ${
            todo.is_complete ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {todo.title}
        </span>
        {/* 날짜 */}
        {dateDisplay && (
          <p className={`text-xs mt-0.5 ${dateDisplay.isPast && !todo.is_complete ? 'text-red-400 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {dateDisplay.date}{dateDisplay.isPast && !todo.is_complete ? ' · Delayed' : ''}
          </p>
        )}
      </div>

      {/* 카테고리 배지들 + 삭제 */}
      <div className="flex-shrink-0 flex items-center gap-1.5 flex-wrap justify-end max-w-[140px]">
        {todo.categories.map((cat) => (
          <span
            key={cat.id}
            className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: `${cat.color}20`,
              color: cat.color,
            }}
          >
            {cat.name}
          </span>
        ))}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
          aria-label="삭제"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
