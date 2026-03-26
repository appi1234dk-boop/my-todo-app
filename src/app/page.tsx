import { createServerClient } from '@/lib/supabase/server';
import { mapTodo } from '@/lib/map-todo';
import { Category } from '@/lib/types';
import TodoBoard from '@/components/TodoBoard';
import ThemeToggle from '@/components/ThemeToggle';

export default async function Page() {
  const supabase = await createServerClient();

  const [{ data: rawTodos }, { data: categories }] = await Promise.all([
    supabase
      .from('todos')
      .select('*, todo_categories(category_id, categories(*))')
      .order('position'),
    supabase.from('categories').select('*').order('name'),
  ]);

  const todos = (rawTodos ?? []).map(mapTodo);

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">QuickPlan</h1>
          <ThemeToggle />
        </div>
        <TodoBoard
          initialTodos={todos}
          categories={(categories ?? []) as Category[]}
        />
      </div>
    </main>
  );
}
