export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Todo {
  id: string;
  title: string;
  is_complete: boolean;
  due_date: string | null;
  category_ids: string[];     // 다중 카테고리 (빈 배열 = 없음)
  categories: Category[];     // join 결과 배열
  position: number;
  created_at: string;
  updated_at: string;
}
