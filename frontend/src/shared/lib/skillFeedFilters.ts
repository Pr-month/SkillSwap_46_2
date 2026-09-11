import type { IPublicSkillCard } from "../../utils/types";
import type {
  TGenderOption,
  TSkillOption,
} from "../../widgets/filter-bar/radio-groups/types";

export const matchesCityFeed = (
  item: IPublicSkillCard,
  cities: string[],
): boolean =>
  cities.length === 0 ||
  (!!item.user.city && cities.includes(item.user.city.name));

// TODO: бэкенд пока не отдаёт user.gender в GET /skills — фильтр по полу
// временно не сужает результаты. Когда поле добавят: положить его в тип
// IPublicSkillCard.user и заменить return true на item.user.gender === gender.
export const matchesGenderFeed = (
  _item: IPublicSkillCard,
  _gender: TGenderOption,
): boolean => true;

export const matchesSkillFeed = (
  item: IPublicSkillCard,
  subCategoryIds: string[],
  skillOption: TSkillOption,
): boolean => {
  if (subCategoryIds.length === 0) return true;

  const wantsToLearn = (item.user.wantToLearn ?? []).some((w) =>
    subCategoryIds.includes(w.id),
  );

  // TODO: у навыка пока нет собственной категории в ответе GET /skills,
  // поэтому "чему может научить" временно не фильтруется по категории.
  if (skillOption === "can-teach") return true;
  if (skillOption === "want-to-learn") return wantsToLearn;

  return wantsToLearn; // 'all'
};