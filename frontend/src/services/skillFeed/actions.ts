import { createAsyncThunk } from "@reduxjs/toolkit";
import { getSkillFeed } from "../../api/skillApi";

export const fetchSkillFeed = createAsyncThunk(
  "skillFeed/get",
  async (params?: { page?: number; limit?: number; search?: string }) =>
    getSkillFeed(params),
);