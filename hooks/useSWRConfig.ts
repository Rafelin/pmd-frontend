import { SWRConfiguration } from "swr";
import { apiClient } from "@/lib/api";

// SWR fetcher function
export const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response;
};

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher: async (url: string) => {
    try {
      const response = await apiClient.get(url);
      return response;
    } catch (error: any) {
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('La solicitud tardó demasiado. Por favor, intenta nuevamente.');
      }
      // Handle network errors
      if (error.message === 'Network Error' || !error.response) {
        throw new Error('Error de conexión. Verifica tu conexión a internet.');
      }
      throw error;
    }
  },
  revalidateOnFocus: false, // No revalidar cuando la ventana recupera el foco
  revalidateOnReconnect: true, // Revalidar cuando se reconecta a internet
  shouldRetryOnError: (error: any) => {
    // No reintentar en errores 429 (Too Many Requests) para evitar bucles infinitos
    // El servidor ya está indicando que hay demasiadas solicitudes
    if (error?.response?.status === 429 || error?.status === 429) {
      return false;
    }
    // Don't retry on 401, 403, or 404
    if (error?.response?.status === 401 || error?.status === 401 ||
        error?.response?.status === 403 || error?.status === 403 ||
        error?.response?.status === 404 || error?.status === 404) {
      return false;
    }
    // Don't retry on timeout or network errors (they will be retried by SWR's default mechanism)
    if (error?.code === 'ECONNABORTED' || error?.message === 'Network Error') {
      return true;
    }
    return true;
  },
  errorRetryCount: 3,
  errorRetryInterval: 5000, // Fixed interval of 5 seconds
  dedupingInterval: 5000, // Deduplicate requests within 5 seconds (aumentado de 2s)
  focusThrottleInterval: 10000, // Throttle revalidation on focus (aumentado de 5s)
  revalidateIfStale: false, // NO revalidar automáticamente datos obsoletos (cambiado de true)
  keepPreviousData: true, // Keep previous data while fetching new data
  // No configurar refreshInterval para evitar polling automático
  // Cache configuration for different data types
  onSuccess: (data: any, key: string) => {
    // Log cache hits in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[SWR] Cache hit for: ${key}`);
    }
  },
} as SWRConfiguration;

