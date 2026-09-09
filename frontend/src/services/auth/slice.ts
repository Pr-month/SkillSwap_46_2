import { createSlice } from "@reduxjs/toolkit";
import {
  fetchCheckUser,
  fetchLogin,
  fetchLogout,
  fetchProfile,
  fetchRegister,
  fetchUpdateCurrentUser,
  fetchUpdateMyProfile,
  fetchUpdateWantToLearn,
  updatePassword,
} from "./actions.ts";
import type { AuthState } from "./types.ts";
import type { IRealUserMeResponse, IUserProfile } from "../../utils/types.ts";
 
// Реальный GET /users/me отдаёт другую форму, чем IUserProfile (city — объект,
// нет likesSkillsIds/userSkill/interestedSkillsSubcategoriesIds — эти relations
// пока не подгружаются этим эндпоинтом, см. чат с бэком). Приводим к тому,
// что ждёт остальной фронтенд, сохраняя уже известные локальные поля,
// которых в этом ответе нет (не затираем их дефолтами).
const mapRealUserToProfile = (
  user: IRealUserMeResponse,
  previous: IUserProfile | null,
): IUserProfile => ({
  id: user.id,
  email: user.email,
  name: user.name ?? "",
  birthDate: user.birthdate ?? "",
  gender: (user.gender as IUserProfile["gender"]) ?? previous?.gender,
  city: user.city?.name ?? "",
  avatar: user.avatar ?? "",
  likesSkillsIds: previous?.likesSkillsIds ?? [],
  userSkill: previous?.userSkill ?? "",
  interestedSkillsSubcategoriesIds:
    previous?.interestedSkillsSubcategoriesIds ?? [],
  createdAt: previous?.createdAt ?? "",
  updatedAt: previous?.updatedAt ?? "",
});
 
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
  reducers: {},
  extraReducers: (builder) => {
    // register
    builder
      .addCase(fetchRegister.pending, handlePending)
      .addCase(fetchRegister.fulfilled, (state, action) => {
        state.loading = false;
        const { id, email, name } = action.payload.user;
        // Ответ на регистрацию сейчас скудный (id/email/role/name) —
        // достраиваем до полного IUserProfile дефолтами; реальные данные
        // допишутся на шаге 2 (PATCH /users/me и .../want-to-learn).
        state.currentUser = {
          id,
          email,
          name: name ?? "",
          birthDate: "",
          city: "",
          avatar: "",
          likesSkillsIds: [],
          userSkill: "",
          interestedSkillsSubcategoriesIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      })
      .addCase(fetchRegister.rejected, handleRejected)
 
      // login
      .addCase(fetchLogin.pending, handlePending)
      .addCase(fetchLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.user;
      })
      .addCase(fetchLogin.rejected, handleRejected)
 
      // logout — куку стирает бэкенд (POST /auth/logout), тут только
      // локально чистим currentUser после успешного ответа.
      .addCase(fetchLogout.fulfilled, (state) => {
        state.currentUser = null;
      })
      .addCase(fetchLogout.rejected, handleRejected)
 
      // profile
      .addCase(fetchProfile.pending, handlePending)
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = mapRealUserToProfile(
          action.payload,
          state.currentUser,
        );
      })
      .addCase(fetchProfile.rejected, handleRejected)
 
      // updateCurrentUser
      .addCase(fetchUpdateCurrentUser.pending, handlePending)
      .addCase(fetchUpdateCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload — реальная форма User с бэкенда (через
        // updateMyProfile), не IUserProfile напрямую — та же причина,
        // что и у fetchProfile.
        state.currentUser = mapRealUserToProfile(
          action.payload as unknown as IRealUserMeResponse,
          state.currentUser,
        );
      })
      .addCase(fetchUpdateCurrentUser.rejected, handleRejected)
 
      // updateMyProfile (шаг 2 регистрации / редактирование профиля)
      .addCase(fetchUpdateMyProfile.pending, handlePending)
      .addCase(fetchUpdateMyProfile.fulfilled, (state) => {
        state.loading = false;
        // Полную синхронизацию currentUser теперь делает fetchProfile
        // (register-page вызывает его в конце регистрации) — он же
        // приводит реальную форму User к IUserProfile через
        // mapRealUserToProfile. Точечный костыль тут больше не нужен.
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
 
export default authSlice.reducer;