import { API_BASE_URL } from "../config/api.config";
import { AuthUser } from "../types/auth.types";
import { sessionService } from "./session.service";
import { request } from "../utils/api";

export type UserFavorite = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type SearchHistoryItem = {
  id: number;
  query: string;
  address?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
};

const DEFAULT_TIMEOUT = 10000; // 10 segundos

async function updateProfile(name: string): Promise<{ message: string; user: AuthUser }> {
  const token = await sessionService.getToken();

  const result = await request<{ message: string; user: AuthUser }>(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
    timeout: DEFAULT_TIMEOUT,
  });

  // Atualiza o usuário na sessão local
  await sessionService.updateUserSession(result.user);

  return result;
}

async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const token = await sessionService.getToken();

  return request<{ message: string }>(`${API_BASE_URL}/users/me/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
    timeout: DEFAULT_TIMEOUT,
  });
}

/**
 * Exclui a conta do próprio usuário autenticado.
 */
async function deleteOwnAccount(): Promise<{ message: string }> {
  const token = await sessionService.getToken();

  if (!token) {
    throw new Error("Usuário não autenticado.");
  }

  return request<{ message: string }>(`${API_BASE_URL}/users/me`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: DEFAULT_TIMEOUT,
  });
}

// -------------------------
// PUSH NOTIFICATIONS
// -------------------------
async function updatePushToken(pushToken: string): Promise<{ message: string }> {
  const token = await sessionService.getToken();
  if (!token) throw new Error("Usuário não autenticado.");

  return request<{ message: string }>(`${API_BASE_URL}/users/push-token`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ pushToken }),
    timeout: DEFAULT_TIMEOUT,
  });
}

// -------------------------
// FAVORITOS
// -------------------------
async function getFavorites(): Promise<UserFavorite[]> {
  const token = await sessionService.getToken();
  if (!token) return [];

  return request<UserFavorite[]>(`${API_BASE_URL}/users/favorites`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    timeout: DEFAULT_TIMEOUT,
  });
}

async function addFavorite(data: Omit<UserFavorite, "id">): Promise<UserFavorite> {
  const token = await sessionService.getToken();
  if (!token) throw new Error("Usuário não autenticado.");

  return request<UserFavorite>(`${API_BASE_URL}/users/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    timeout: DEFAULT_TIMEOUT,
  });
}

async function deleteFavorite(id: number): Promise<{ message: string }> {
  const token = await sessionService.getToken();
  if (!token) throw new Error("Usuário não autenticado.");

  return request<{ message: string }>(`${API_BASE_URL}/users/favorites/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    timeout: DEFAULT_TIMEOUT,
  });
}

// -------------------------
// HISTÓRICO DE BUSCAS
// -------------------------
async function getHistory(): Promise<SearchHistoryItem[]> {
  const token = await sessionService.getToken();
  if (!token) return [];

  return request<SearchHistoryItem[]>(`${API_BASE_URL}/users/history`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    timeout: DEFAULT_TIMEOUT,
  });
}

async function addHistory(data: Omit<SearchHistoryItem, "id" | "createdAt">): Promise<SearchHistoryItem> {
  const token = await sessionService.getToken();
  if (!token) throw new Error("Usuário não autenticado.");

  return request<SearchHistoryItem>(`${API_BASE_URL}/users/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    timeout: DEFAULT_TIMEOUT,
  });
}

async function clearHistory(): Promise<{ message: string }> {
  const token = await sessionService.getToken();
  if (!token) throw new Error("Usuário não autenticado.");

  return request<{ message: string }>(`${API_BASE_URL}/users/history`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    timeout: DEFAULT_TIMEOUT,
  });
}

export const userService = {
  updateProfile,
  changePassword,
  deleteOwnAccount,
  updatePushToken,
  getFavorites,
  addFavorite,
  deleteFavorite,
  getHistory,
  addHistory,
  clearHistory,
};
