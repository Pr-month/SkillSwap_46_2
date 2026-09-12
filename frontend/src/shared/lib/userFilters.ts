import type { IUserProfile, ISkill } from "../../utils/types";
import type {
  TGenderOption,
  TSkillOption,
} from "../../widgets/filter-bar/radio-groups/types";

// Фильтр по полу пока работает со старыми значениями (male/female),
// а IUserProfile.gender переведён на TGender (MALE/FEMALE/UNSPECIFIED).
const GENDER_FILTER_MAP: Record<Exclude<TGenderOption, "all">, IUserProfile["gender"]> = {
  male: "MALE",
  female: "FEMALE",
};

export const matchesGender = (
  user: IUserProfile,
  gender: TGenderOption,
): boolean => {
  if (gender === "all") return true;
  return user.gender === GENDER_FILTER_MAP[gender];
};

export const matchesCity = (user: IUserProfile, cities: string[]): boolean =>
  cities.length === 0 || cities.includes(user.city);

export const matchesSkill = (
  user: IUserProfile,
  subCategoryIds: string[],
  skillOption: TSkillOption,
  skills: ISkill[],
): boolean => {
  if (subCategoryIds.length === 0) return true;

  const userSkillSubcategory = skills.find(
    (s) => s.id === user.userSkill,
  )?.skillSubcategory;

  if (skillOption === "can-teach")
    return (
      !!userSkillSubcategory && subCategoryIds.includes(userSkillSubcategory)
    );

  if (skillOption === "want-to-learn")
    return user.interestedSkillsSubcategoriesIds.some((id) =>
      subCategoryIds.includes(id),
    );

  // 'all'
  const canTeach =
    !!userSkillSubcategory && subCategoryIds.includes(userSkillSubcategory);
  const wantsToLearn = user.interestedSkillsSubcategoriesIds.some((id) =>
    subCategoryIds.includes(id),
  );
  return canTeach || wantsToLearn;
};
