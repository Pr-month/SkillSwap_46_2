import { createSlice } from "@reduxjs/toolkit";
import { tokenService } from "../../utils/tokenService.ts";
import {
  fetchCheckUser,
  fetchLogin,
  fetchProfile,
  fetchRegister,
  fetchUpdateCurrentUser,
  fetchUpdateMyProfile,
  fetchUpdateWantToLearn,
  updatePassword,
} from "./actions.ts";
import type { AuthState } from "./types.ts";

const normalizeCurrentUser = (user: any) => {
  if (!user) return null;

  return {
    ...user,
    likesSkillsIds: Array.isArray(user.likesSkillsIds) ? user.likesSkillsIds : [],
    interestedSkillsSubcategoriesIds: Array.isArray(
      user.interestedSkillsSubcategoriesIds,
    )
      ? user.interestedSkillsSubcategoriesIds
      : [],
    userSkill: user.userSkill ?? "",
    city: user.city ?? "",
    avatar: user.avatar ?? "",
    birthDate: user.birthDate ?? user.birthdate ?? "",
  };
};

const initialState: AuthState = {
  currentUser: null,
  loading: false,
  error: null,
  checkUserLoading: false,
  checkUserError: null,
};

const handlePending = (state: AuthState) => {
  state.loading = true;
  state.error = null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleRejected = (state: AuthState, action: any) => {
  state.loading = false;
  state.error = action.error.message || "Ошибка запроса";
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.currentUser = null;
      tokenService.remove();
    },
  },
  extraReducers: (builder) => {
    // register
    builder
      .addCase(fetchRegister.pending, handlePending)
      .addCase(fetchRegister.fulfilled, (state, action) => {
        state.loading = false;
        const userPayload = action.payload.user as any;

        state.currentUser = normalizeCurrentUser({
          ...userPayload,
          birthDate: userPayload?.birthDate ?? "",
          city: userPayload?.city ?? "",
          avatar: userPayload?.avatar ?? "",
          likesSkillsIds: userPayload?.likesSkillsIds ?? [],
          userSkill: userPayload?.userSkill ?? "",
          interestedSkillsSubcategoriesIds:
            userPayload?.interestedSkillsSubcategoriesIds ?? [],
          createdAt: userPayload?.createdAt ?? new Date().toISOString(),
          updatedAt: userPayload?.updatedAt ?? new Date().toISOString(),
        });
      })
      .addCase(fetchRegister.rejected, handleRejected)

      // login
      .addCase(fetchLogin.pending, handlePending)
      .addCase(fetchLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = normalizeCurrentUser(action.payload.user);
      })
      .addCase(fetchLogin.rejected, handleRejected)

      // profile
      .addCase(fetchProfile.pending, handlePending)
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = normalizeCurrentUser(action.payload);
      })
      .addCase(fetchProfile.rejected, handleRejected)

      // updateCurrentUser
      .addCase(fetchUpdateCurrentUser.pending, handlePending)
      .addCase(fetchUpdateCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = normalizeCurrentUser(action.payload);
      })
      .addCase(fetchUpdateCurrentUser.rejected, handleRejected)

      // updateMyProfile (шаг 2 регистрации / редактирование профиля)
      .addCase(fetchUpdateMyProfile.pending, handlePending)
      .addCase(fetchUpdateMyProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Полная синхронизация currentUser с реальной формой User с бэкенда —
        // отдельная задача (birthdate/city там в другом формате, чем в
        // IUserProfile). Но name/avatar — простые строки, синхронизируем
        // сразу, иначе после регистрации в шапке показывается старое пустое
        // значение, хотя в базе данные уже сохранены.
        if (state.currentUser) {
          const payload = action.payload as { name?: string; avatar?: string };
          if ("name" in payload) state.currentUser.name = payload.name ?? "";
          if ("avatar" in payload)
            state.currentUser.avatar = payload.avatar ?? "";
        }
      })
      .addCase(fetchUpdateMyProfile.rejected, handleRejected)
 
      // updateWantToLearn (шаг 2 регистрации)
      .addCase(fetchUpdateWantToLearn.pending, handlePending)
      .addCase(fetchUpdateWantToLearn.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchUpdateWantToLearn.rejected, handleRejected);

    builder
      .addCase(fetchCheckUser.pending, (state) => {
        state.checkUserLoading = true;
        state.checkUserError = null;
      })
      .addCase(fetchCheckUser.fulfilled, (state) => {
        state.checkUserLoading = false;
        state.checkUserError = null;
      })
      .addCase(fetchCheckUser.rejected, (state, action) => {
        state.checkUserLoading = false;
        state.checkUserError = action.payload;
      })

      // ИЗМЕНЕНИЕ ПАРОЛЯ
      .addCase(updatePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.code || "Ошибка изменения пароля";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
