import { USE_MOCKS } from "../config/apiConfig";
import { tokenService } from "../utils/tokenService.ts";
import type {
  IUserProfile,
  TLoginUserData,
  TLoginUserResponse,
  TRegisterResponse,
} from "../utils/types";
import { api, request } from "./client";

const MOCK_TOKEN = "mock_jwt_token";


// POST /auth/register — сейчас отправляем ТОЛЬКО email и password.
// Остальные поля профиля уходят отдельными запросами на шаге 2
// (PATCH /users/me и PATCH /users/me/want-to-learn).
export const registerUser = async (
  data: TLoginUserData,
): Promise<TRegisterResponse> => {
  if (USE_MOCKS) {
    tokenService.set(MOCK_TOKEN);
    return {
      user: {
        id: "mock-user-1",
        email: data.email,
        role: "USER",
        name: null,
      },
    };
  }

  return request<TRegisterResponse>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

// POST /auth/login
export const loginUser = async (
  data: TLoginUserData,
): Promise<TLoginUserResponse> => {
  if (USE_MOCKS) {
    const response = await fetch("/users.json").then((res) => res.json());
    const user = response.data.find(
      (u: IUserProfile) => u.email === data.email,
    );
    if (!user) return Promise.reject({ message: "Пользователь не найден" });
    tokenService.set(MOCK_TOKEN);
    return {
      status: true,
      access_token: MOCK_TOKEN,
      user,
    };
  }

  const resp = await request<TLoginUserResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return resp;
};

// POST /auth/check-user
export const checkUser = async (data: TLoginUserData): Promise<void> => {
  const resp = await request<void>("/auth/check-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return resp;
};

// GET /auth/profile
export const getProfile = async (): Promise<IUserProfile> => {
  if (USE_MOCKS) {
    const response = await fetch("/users.json").then((res) => res.json());
    return response.data[0]; // в моках возвращаем первого юзера
  }

  const response = await request<{ data: IUserProfile }>("/auth/profile");
  return response.data;
};

// PATCH /auth/password
export const changePassword = async (
  newPassword: string,
): Promise<{ newPassword: string }> => {
  if (USE_MOCKS) {
    return { newPassword };
  }

  const resp = await api.patch<{ newPassword: string }>(
    "/auth/password",
    { newPassword: newPassword },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return resp;
};