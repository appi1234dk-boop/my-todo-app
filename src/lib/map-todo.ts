import { Category, Todo } from './types';

export function mapTodo(raw: any): Todo {
  const categories: Category[] = (raw.todo_categories ?? []).map(
    (tc: any) => tc.categories
  );
  return {
    id: raw.id,
    title: raw.title,
    is_complete: raw.is_complete,
    due_date: raw.due_date ?? null,
    position: raw.position,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    category_ids: categories.map((c) => c.id),
    categories,
  };
}
