import { QueryClient } from "@tanstack/react-query";

// Create a global query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
  },
});

// Default fetcher for queries
export const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Set default query function
queryClient.setDefaultOptions({
  queries: {
    queryFn: async ({ queryKey }) => {
      const [url] = queryKey as [string];
      return apiRequest(url);
    },
  },
});