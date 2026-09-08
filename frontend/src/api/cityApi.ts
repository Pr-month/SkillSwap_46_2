import { request } from "./client";
import type { TId } from "../utils/types";

export interface ICity {
  id: TId;
  name: string;
  region: string;
}

/** API: ПОИСК ГОРОДОВ (для выпадающего списка) */
export const getCities = (search?: string): Promise<ICity[]> => {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return request<ICity[]>(`/cities${qs}`);
};