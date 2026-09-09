const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Generic helper ───────────────────────────────────────────────────────────

export const apiFetch = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include",
      ...options,
    });

    if (!res.ok) {
      let errorMessage = "Something went wrong";
      try {
        const errData = await res.json() as { message?: string };
        errorMessage = errData.message || errorMessage;
      } catch { /* ignore JSON parse error */ }
      throw new Error(errorMessage);
    }

    return res.json() as Promise<T>;
  } catch (error: unknown) {
    console.error("API ERROR:", (error as Error).message);
    throw error;
  }
};

// ─── Axios instance ───────────────────────────────────────────────────────────

import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers["Content-Type"];
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

// ─── Product Variant API ───────────────────────────────────────────────────

/** Product / Item type returned by the backend (local _id string is `id`) */
export interface ProductVariantApi {
  _id: string;
  productId: string;
  color?: string;
  size?: string;
  image: string;
  stock: number;
  price: number;
  sku?: string;
  createdAt: string;
}

/** Full product-with-variants response from GET /api/items/:id */
export interface ProductDetailApi {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  variants: ProductVariantApi[];
}

/**
 * Fetch a single product together with all its variants.
 * GET /api/items/:id
 *
 * @param id  MongoDB ObjectId of the parent product
 */
export async function fetchProductWithVariants(
  id: string,
): Promise<ProductDetailApi> {
  const res = await apiFetch<ProductDetailApi>(`/api/items/${id}`);
  return res;
}

/**
 * Fetch all variants for a given product.
 * GET /api/product-variants/product/:productId
 *
 * @param productId  MongoDB ObjectId of the parent product
 */
export async function fetchVariantsForProduct(
  productId: string,
): Promise<ProductVariantApi[]> {
  const res = await api.get<ProductVariantApi[]>(
    `/api/product-variants/product/${productId}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Create a new variant for a product.
 * POST /api/product-variants
 */
export async function createVariant(
  productId: string,
  data: {
    color?: string;
    size?: string;
    image: string;
    stock: number;
    price: number;
    sku?: string;
  },
): Promise<ProductVariantApi> {
  const res = await api.post<ProductVariantApi>("/api/product-variants", {
    productId,
    ...data,
  });
  return res.data;
}

/**
 * Update an existing variant.
 * PATCH /api/product-variants/:id
 */
export async function updateVariant(
  variantId: string,
  data: Partial<{
    productId: string;
    color: string;
    size: string;
    image: string;
    stock: number;
    price: number;
    sku: string;
  }>,
): Promise<ProductVariantApi> {
  const res = await api.patch<ProductVariantApi>(
    `/api/product-variants/${variantId}`,
    data,
  );
  return res.data;
}

/**
 * Delete a variant permanently.
 * DELETE /api/product-variants/:id
 */
export async function deleteVariant(variantId: string): Promise<void> {
  await api.delete(`/api/product-variants/${variantId}`);
}

/**
 * Upload a single variant image to Cloudinary via the existing
 * Cloudinary upload endpoint, returning the Cloudinary URL.
 * (Used so that the admin variant form can reuse the image upload logic.)
 */
export async function uploadVariantImage(
  file: File,
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await api.post<{ url: string; publicId: string }>(
    "/api/items/upload-image",
    formData,
  );
  return res.data;
}