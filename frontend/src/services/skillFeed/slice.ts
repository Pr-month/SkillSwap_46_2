import { createSlice } from "@reduxjs/toolkit";
import type { IPublicSkillCard } from "../../utils/types";
import { fetchSkillFeed } from "./actions";

export interface ISkillFeedState {
  loading: boolean;
  data: IPublicSkillCard[];
  page: number;
  totalPages: number;
  error: string | null;
}

const initialState: ISkillFeedState = {
  loading: false,
  data: [],
  page: 1,
  totalPages: 1,
  error: null,
};

export const skillFeedSlice = createSlice({
  name: "skillFeed",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkillFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkillFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchSkillFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Ошибка получения навыков";
        console.error(state.error);
      });
  },
  selectors: {
    selectSkillFeed: (state: ISkillFeedState) => state.data,
    selectSkillFeedLoading: (state: ISkillFeedState) => state.loading,
  },
});

export const { selectSkillFeed, selectSkillFeedLoading } =
  skillFeedSlice.selectors;

export default skillFeedSlice.reducer;