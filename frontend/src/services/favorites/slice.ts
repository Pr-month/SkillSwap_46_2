import { createSlice } from "@reduxjs/toolkit";
import type { TId } from "../../utils/types";
import { toggleFavoriteSkill } from "./actions";

export interface FavoritesState {
  // TODO: бэкенд пока не отдаёт favoriteSkills в GET /users/me, поэтому тут
  // хранится только то, что пользователь пометил за текущую сессию (сбросится
  // после F5). Когда бэкенд добавит поле — проинициализировать этот список
  // из ответа профиля при логине/загрузке приложения.
  ids: TId[];
}

const initialState: FavoritesState = { ids: [] };

export const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(toggleFavoriteSkill.fulfilled, (state, action) => {
      const { skillId, isFavorite } = action.payload;
      if (isFavorite) {
        if (!state.ids.includes(skillId)) state.ids.push(skillId);
      } else {
        state.ids = state.ids.filter((id) => id !== skillId);
      }
    });
  },
  selectors: {
    selectFavoriteIds: (state: FavoritesState) => state.ids,
  },
});

export const { selectFavoriteIds } = favoritesSlice.selectors;
export default favoritesSlice.reducer;