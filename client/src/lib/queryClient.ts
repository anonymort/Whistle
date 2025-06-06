import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getCSRFToken(): Promise<string> {
  const response = await fetch('/api/csrf-token', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  const data = await response.json();
  return data.csrfToken;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token for non-GET requests
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    try {
      const csrfToken = await getCSRFToken();
      headers["X-CSRF-Token"] = csrfToken;
    } catch (error) {
      console.error("Failed to get CSRF token:", error);
      throw new Error("Security validation failed");
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Simple API request function for submissions
export async function submitData(url: string, data: unknown): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  try {
    const csrfToken = await getCSRFToken();
    headers["X-CSRF-Token"] = csrfToken;
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    throw new Error("Security validation failed");
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

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
