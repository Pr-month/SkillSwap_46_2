import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { selectSkillFeed } from "./slice";
import {
  matchesCityFeed,
  matchesGenderFeed,
  matchesSkillFeed,
} from "../../shared/lib/skillFeedFilters";

export const selectNewestSkillFeed = createSelector(selectSkillFeed, (items) =>
  [...items].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ),
);

// TODO: бэкенд пока не отдаёт счётчик добавлений в избранное на уровне
// списка навыков — используем "Новое" как временную замену "Популярному".
export const selectPopularSkillFeed = selectNewestSkillFeed;

export const selectRecommendedSkillFeed = createSelector(
  selectSkillFeed,
  (state: RootState) => state.auth.currentUser,
  (items, currentUser) => {
    const getRandom = (list: typeof items) =>
      [...list].sort(() => Math.random() - 0.5).slice(0, 9);

    const withoutOwn = currentUser
      ? items.filter(
          (item) => String(item.user.id) !== String(currentUser.id),
        )
      : items;

    // TODO: у навыка пока нет собственной категории в ответе GET /skills,
    // поэтому персонализация "по интересам" временно недоступна.
    return getRandom(withoutOwn);
  },
);

export const selectFilteredSkillFeed = createSelector(
  selectSkillFeed,
  (state: RootState) => state.filter.subCategoryIds,
  (state: RootState) => state.filter.gender,
  (state: RootState) => state.filter.skillOption,
  (state: RootState) => state.filter.cities,
  (state: RootState) => state.filter.searchQuery,
  (items, subCategoryIds, gender, skillOption, cities, searchQuery) => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter(
      (item) =>
        matchesGenderFeed(item, gender) &&
        matchesCityFeed(item, cities) &&
        matchesSkillFeed(item, subCategoryIds, skillOption) &&
        (!query || item.title.toLowerCase().includes(query)),
    );
  },
);