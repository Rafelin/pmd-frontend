import { SWRConfiguration } from "swr";
import api from "./api";
import { AxiosError } from "axios";

export const swrConfig: SWRConfiguration = {
  fetcher: async (url: string) => {
    const res = await api.get(url);
    return res.data;
  },
  revalidateOnFocus: false, // No revalidar cuando la ventana recupera el foco
  revalidateOnReconnect: true, // Revalidar cuando se reconecta a internet
  shouldRetryOnError: (error: any) => {
    // No reintentar en errores 429 (Too Many Requests) para evitar bucles infinitos
    // El servidor ya está indicando que hay demasiadas solicitudes
    if (error?.response?.status === 429) {
      return false;
    }
    // No reintentar en errores de autenticación/autorización
    if (error?.response?.status === 401 || error?.response?.status === 403 || error?.response?.status === 404) {
      return false;
    }
    // Reintentar en otros errores (timeouts, errores de red, etc.)
    return true;
  },
  errorRetryCount: 3,
  // Configuración para evitar revalidaciones automáticas excesivas
  revalidateIfStale: false, // No revalidar automáticamente datos obsoletos
  dedupingInterval: 5000, // Deduplicar peticiones dentro de 5 segundos
  focusThrottleInterval: 10000, // Throttle de 10 segundos para revalidación en focus
  // No configurar refreshInterval para evitar polling automático
};

