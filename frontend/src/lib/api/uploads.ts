import { apiClient } from "./client";

export interface UploadedImage {
  url: string;
  filename: string;
  size: number;
  content_type: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
const BACKEND_ROOT = API_URL.replace(/\/api\/v1\/?$/, "");

/** Convert relative /uploads/... URL to full absolute URL */
export function fullUploadUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return `${BACKEND_ROOT}${url}`;
  return url;
}

export const uploadsApi = {
  uploadImage: async (file: File, subdir = "houses"): Promise<UploadedImage> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post<UploadedImage>(
      `/uploads/image?subdir=${encodeURIComponent(subdir)}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },
};
