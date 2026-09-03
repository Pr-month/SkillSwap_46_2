import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addSkillToFavorites,
  removeSkillFromFavorites,
} from "../../api/skillApi";
import type { TId } from "../../utils/types";

export const toggleFavoriteSkill = createAsyncThunk(
  "favorites/toggle",
  async ({
    skillId,
    isCurrentlyFavorite,
  }: {
    skillId: TId;
    isCurrentlyFavorite: boolean;
  }) => {
    if (isCurrentlyFavorite) {
      await removeSkillFromFavorites(skillId);
      return { skillId, isFavorite: false };
    }
    await addSkillToFavorites(skillId);
    return { skillId, isFavorite: true };
  },
);