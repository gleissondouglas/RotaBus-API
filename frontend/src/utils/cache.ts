/**
 * Utilitário de cache persistente local (disco) para armazenar respostas de API.
 * Ajuda a economizar dados e melhorar a performance em buscas repetidas.
 */

import { appStorage } from "../services/storage.service";

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const OFFLINE_CACHE_PREFIX = "offline_cache_";

export const cache = {
  /**
   * Salva um item no cache local (disco) com um timestamp.
   */
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      };
      await appStorage.setItem(`${OFFLINE_CACHE_PREFIX}${safeKey}`, JSON.stringify(item));
    } catch (e) {
      console.warn("Falha ao salvar no cache offline", e);
    }
  },

  /**
   * Recupera um item do cache (disco). Se expirado ou não encontrado, retorna null.
   */
  async get<T>(key: string, ttlMs: number): Promise<T | null> {
    try {
      const safeKey = key.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const stored = await appStorage.getItem(`${OFFLINE_CACHE_PREFIX}${safeKey}`);
      if (!stored) return null;

      const item: CacheItem<T> = JSON.parse(stored);
      const isExpired = Date.now() - item.timestamp > ttlMs;

      if (isExpired) {
        await appStorage.deleteItem(`${OFFLINE_CACHE_PREFIX}${safeKey}`);
        return null;
      }

      return item.data as T;
    } catch (e) {
      console.warn("Falha ao ler cache offline", e);
      return null;
    }
  },

  /**
   * Limpa todo o cache de itens específicos.
   * (Neste caso, não implementaremos o clear global facilmente pois o SecureStore
   * não tem método getAllKeys, mas se necessário pode ser implementado no futuro)
   */
  async clear(): Promise<void> {
    // Para simplificar, sem getAllKeys. O cache expirará naturalmente pelo TTL no get.
  }
};
