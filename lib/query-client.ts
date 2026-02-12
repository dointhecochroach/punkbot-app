import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    return '';
  }

  let url = new URL(`https://${host}`);

  return url.href;
}

let backendReachable: boolean | null = null;
let lastBackendCheck = 0;

export function isBackendAvailable(): boolean {
  if (!process.env.EXPO_PUBLIC_DOMAIN) return false;
  if (backendReachable === false && Date.now() - lastBackendCheck < 60000) return false;
  return true;
}

export async function checkBackendHealth(): Promise<boolean> {
  if (!process.env.EXPO_PUBLIC_DOMAIN) return false;

  try {
    const controller = new AbortController();
    const id = globalThis.setTimeout(() => controller.abort(), 5000);
    const baseUrl = getApiUrl();
    const res = await fetch(`${baseUrl}api/symbols/spot`, { signal: controller.signal });
    globalThis.clearTimeout(id);
    const ok = res.ok;
    backendReachable = ok;
    lastBackendCheck = Date.now();
    return ok;
  } catch {
    backendReachable = false;
    lastBackendCheck = Date.now();
    return false;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  if (!baseUrl) throw new Error('Backend not configured');

  const url = new URL(route, baseUrl);

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    globalThis.clearTimeout(timeoutId);

    backendReachable = true;
    lastBackendCheck = Date.now();

    await throwIfResNotOk(res);
    return res;
  } catch (e) {
    globalThis.clearTimeout(timeoutId);
    backendReachable = false;
    lastBackendCheck = Date.now();
    throw e;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await fetch(url.toString());

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
