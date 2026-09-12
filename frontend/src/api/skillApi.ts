import { USE_MOCKS } from "../config/apiConfig";
import type {
  TId,
  TModifySkillData,
  TSkillData,
  TSkillResponse,
  TSkillsResponse,
  ISkillBackend,
  ISkill
} from "../utils/types";
import { request } from "./client";

interface ApiResponse<T> {
  status: boolean;
  data: T;
}

const formatSkill = (skill: Partial<ISkillBackend> | null | undefined): ISkill => ({
  id: skill?.id ?? "",

  title: skill?.title ?? "",
  description: skill?.description ?? "",
  images: Array.isArray(skill?.images) ? skill.images : [],

  user: skill?.user ?? undefined,
  category: skill?.category ?? undefined,
  skillSubcategory: skill?.category?.id ?? "",

  createdAt: skill?.createdAt ?? new Date().toISOString(),
  updatedAt: skill?.createdAt ?? new Date().toISOString(),
});

//! ЗАПРПОСЫ БЕЗ АВТОРИЗАЦИИ

/** API: ПОЛУЧЕНИЕ ВСЕХ НАВЫКОВ */
export const getSkills = (): Promise<TSkillsResponse> => {
  if (USE_MOCKS) {
    return fetch("/skills.json")
      .then((res) => res.json())
      .then((response) => response);
  }

  return request<ApiResponse<ISkillBackend[]>>("/skills").then((response) => ({
    status: response.status,
    data: response.data.map(formatSkill),
  }));
};

/** API: ПОЛУЧЕНИЕ НАВЫКА ПО ЕГО ID */
export const getSkillById = (skillId: TId): Promise<TSkillResponse> => {
  if (USE_MOCKS) {
    return fetch("/skills.json")
      .then((res) => res.json())
      .then((response) => ({
        status: true,
        data: response.data[0],
      }));
  }

  return request<ApiResponse<ISkillBackend>>(`/skills/${skillId}`).then(
    (response) => ({
      status: response.status,
      data: formatSkill(response.data),
    }),
  );
};

//! ЗАПРПОСЫ С АВТОРИЗАЦИЕЙ

/** API: ДОБАВЛЕНИЕ НАВЫКА */
export const addSkill = (skill: TSkillData): Promise<TSkillResponse> => {
  if (USE_MOCKS) {
    return Promise.resolve({
      status: true,
      data: {
        ...skill,
        id: Date.now().toString(),
        user: {
          id: "mock-user-id",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }
  return request<ApiResponse<ISkillBackend>>("/skills", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(skill),
  }).then((response) => ({
    status: response.status,
    data: formatSkill(response.data),
  }));
};

/** API: УДАЛЕНИЕ НАВЫКА ПО ЕГО ID */
export const deleteSkillById = async (
  skillId: TId,
): Promise<{ status: boolean }> => {
  if (USE_MOCKS) return { status: true };

  await request<void>(`/skills/${skillId}`, {
    method: "DELETE",
  });

  return { status: true };
};

/** API: МОДИФИКАЦИЯ НАВЫКА */
export const modifySkill = (
  skill: TModifySkillData,
): Promise<TSkillResponse> => {
  if (USE_MOCKS) {
    return fetch("/skills.json")
      .then((res) => res.json())
      .then((response) => ({
        status: true,
        data: response.data[0],
      }));
  }

  const { id, ...skillData } = skill;

  // Если id навыка не указан
  if (!id) {
    console.error("Ошибка модификации навыка: отсутствует id навыка");
    return Promise.reject();
  }

  return request<ApiResponse<ISkillBackend>>(`/skills/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(skillData),
  }).then((response) => ({
    status: response.status,
    data: formatSkill(response.data),
  }));
};

import type { IPublicSkillsFeedResponse } from "../utils/types";

/** API: ПУБЛИЧНАЯ ЛЕНТА НАВЫКОВ ДЛЯ ГЛАВНОЙ (навык + вложенный автор) */
export const getSkillFeed = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<IPublicSkillsFeedResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();

  return request<IPublicSkillsFeedResponse>(`/skills${qs ? `?${qs}` : ""}`);
};

/** API: ДОБАВИТЬ НАВЫК В ИЗБРАННОЕ */
export const addSkillToFavorites = (
  skillId: TId,
): Promise<{ message: string }> =>
  request<{ message: string }>(`/skills/${skillId}/favorite`, {
    method: "POST",
  });

/** API: УБРАТЬ НАВЫК ИЗ ИЗБРАННОГО */
export const removeSkillFromFavorites = (
  skillId: TId,
): Promise<{ message: string }> =>
  request<{ message: string }>(`/skills/${skillId}/favorite`, {
    method: "DELETE",
  });
