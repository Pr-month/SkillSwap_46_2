import { interceptors } from "./interceptors";

export function setupApiInterceptors() {
  // Раньше здесь читался localStorage.getItem("accessToken") и вручную
  // подставлялся заголовок Authorization. сейча бэкенд работает через httpOnly-куку

  interceptors.addResponseInterceptor(async (response) => {
    return response;
  });

  interceptors.addErrorInterceptor(async (error) => {
    return Promise.reject(error);
  });
}