// Бэкенд отдаёт путь к загруженному файлу относительным (например,
// "/public/uploads/xxx.png"). Чтобы браузер нашёл файл, нужно подставить
// спереди настоящий адрес бэкенда (иначе браузер будет искать файл на
// самом фронтенде, а не на бэке).
// Абсолютные URL (например, готовые ссылки на pravatar.cc у сид-данных)
// возвращаем как есть — их трогать не нужно.
export const resolveAssetUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
 
  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${backendUrl}${path}`;
};