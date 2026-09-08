import { USE_MOCKS } from "../config/apiConfig";
import { request } from "./client";
import type { TId, ISkillsCategory, ISkillsSubcategory } from "../utils/types";

// Так реально выглядит категория в ответе бэкенда:
// голый объект, без обёртки {status, data}, а подкатегории лежат в "children".
interface IBackendCategory {
  id: string;
  name: string;
  children?: IBackendCategory[];
}

// Приводим категорию бэкенда к форме, которую ждёт остальной фронтенд
// (ISkillsCategory с полем subcategories, где у каждой подкатегории
// есть ссылка на родителя skillCategoryId).
const mapCategory = (category: IBackendCategory): ISkillsCategory => ({
  id: category.id,
  name: category.name,
  subcategories: (category.children ?? []).map((child) => ({
    id: child.id,
    name: child.name,
    skillCategoryId: category.id,
  })),
});

export const getCategories = (): Promise<ISkillsCategory[]> => {
  if (USE_MOCKS) {
    return fetch("/categories.json")
      .then((res) => res.json())
      .then((response) => response.data);
  }

  return request<IBackendCategory[]>("/categories").then((categories) =>
    categories.map(mapCategory),
  );
};

export const getSubCategories = (): Promise<ISkillsSubcategory[]> => {
  if (USE_MOCKS) {
    return fetch("/subcategories.json")
      .then((res) => res.json())
      .then((response) => response.data);
  }

  return request<IBackendCategory[]>("/categories").then((categories) =>
    categories.flatMap(
      (category) => mapCategory(category).subcategories,
    ),
  );
};

export const getCategoryById = (id: TId): Promise<ISkillsCategory> => {
  if (USE_MOCKS) {
    return fetch("/categories.json")
      .then((res) => res.json())
      .then(
        (response) =>
          response.data.find(
            (category: ISkillsCategory) => category.id === id,
          )!,
      );
  }

  return request<IBackendCategory>(`/categories/${id}`).then(mapCategory);
};