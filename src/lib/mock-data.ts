import { Category, Todo } from './types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '개인', color: '#6366f1' },
  { id: 'cat-2', name: '업무', color: '#f59e0b' },
  { id: 'cat-3', name: '공부', color: '#10b981' },
];

const categoryMap = Object.fromEntries(MOCK_CATEGORIES.map((c) => [c.id, c]));

// 오늘 날짜를 YYYY-MM-DD 형식으로
const today = new Date().toISOString().split('T')[0];

export const MOCK_TODOS: Todo[] = [
  {
    id: 'todo-1',
    title: '장보기 (우유, 계란, 채소)',
    is_complete: false,
    due_date: today, // Today 섹션에 표시됨
    category_ids: ['cat-1'],
    categories: [categoryMap['cat-1']],
    position: 1,
    created_at: '2026-03-25T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
  },
  {
    id: 'todo-2',
    title: '주간 보고서 작성 및 팀장 보고',
    is_complete: false,
    due_date: today, // Today 섹션에 표시됨
    category_ids: ['cat-2', 'cat-1'], // 다중 카테고리 예시
    categories: [categoryMap['cat-2'], categoryMap['cat-1']],
    position: 2,
    created_at: '2026-03-25T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
  },
  {
    id: 'todo-3',
    title: 'Next.js 16 App Router 공부',
    is_complete: false,
    due_date: '2026-03-30',
    category_ids: ['cat-3'],
    categories: [categoryMap['cat-3']],
    position: 3,
    created_at: '2026-03-25T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
  },
  {
    id: 'todo-4',
    title: 'TypeScript 심화 학습',
    is_complete: false,
    due_date: '2026-04-02',
    category_ids: ['cat-3', 'cat-2'],
    categories: [categoryMap['cat-3'], categoryMap['cat-2']],
    position: 4,
    created_at: '2026-03-25T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
  },
  {
    id: 'todo-5',
    title: '독서: 클린 코드 3장',
    is_complete: true,
    due_date: null,
    category_ids: ['cat-3'],
    categories: [categoryMap['cat-3']],
    position: 5,
    created_at: '2026-03-24T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
  },
  {
    id: 'todo-6',
    title: '운동 (헬스 1시간)',
    is_complete: true,
    due_date: '2026-03-25',
    category_ids: ['cat-1'],
    categories: [categoryMap['cat-1']],
    position: 6,
    created_at: '2026-03-24T00:00:00Z',
    updated_at: '2026-03-25T00:00:00Z',
  },
];
