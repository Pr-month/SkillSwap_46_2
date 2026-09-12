import type { ISkillsSubcategory } from "../../utils/types.ts";

// Бэкенд не присылает interestedSkillsSubcategoriesIds у
// пользователя, поэтому подстраховываемся значениями по умолчанию,
// чтобы страница не падала, если поле отсутствует.
export const getSubcategoryNames = (
  ids: string[] = [],
  subCategories: ISkillsSubcategory[] = [],
): string[] =>
  (ids ?? [])
    .map((id) => subCategories.find((s) => s.id === id)?.name ?? "")
    .filter((name) => Boolean(name));