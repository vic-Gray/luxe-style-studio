import axios from "axios";

/* ================= TYPES ================= */

export interface Slideshow {
  id: string;
  imageUrl: string;
  title: string;
  displayText: string;
  order: number;
  createdAt: string;
}

/* ================= ENV SAFETY ================= */

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("❌ VITE_API_BASE_URL is not defined in .env file");
}

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: BASE_URL.replace(/\/$/, ""),
});

/* ================= LIST ================= */

export const fetchSlideshows = async (
  page = 1,
  limit = 20
): Promise<Slideshow[]> => {
  console.log("[fetchSlideshows] Fetching from URL:", `${BASE_URL}/api/slideshow?page=${page}&limit=${limit}`);
  
  const res = await api.get("/api/slideshow", {
    params: { page, limit },
  });

  console.log("[fetchSlideshows] Response status:", res.status);
  console.log("[fetchSlideshows] Response data:", res.data);

  const responseData = res.data;

  // Handle both direct array format and paginated { data: [] } format
  const slideshows: Slideshow[] = Array.isArray(responseData)
    ? (responseData as Slideshow[])
    : ((responseData?.data || []) as Slideshow[]);

  console.log("[fetchSlideshows] Parsed slideshows count:", slideshows.length);

  if (!Array.isArray(slideshows)) {
    throw new Error("Invalid API response format");
  }

  return slideshows.map((slideshow: Slideshow) => ({
    id: (slideshow as Slideshow & { _id?: string })._id ?? slideshow.id,
    imageUrl: slideshow.imageUrl,
    title: slideshow.title,
    displayText: slideshow.displayText,
    order: slideshow.order,
    createdAt: slideshow.createdAt,
  }));
};

/* ================= DELETE ALL ================= */

export const deleteAllSlideshows = async (): Promise<{ deletedCount: number }> => {
  const res = await api.delete("/api/slideshow/delete-all");
  return res.data;
};