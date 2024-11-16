/**
 * Logger Types and Configuration
 */
export type HookLogger = {
  onRequest?: (url: string, options: RequestInit) => void;
  onResponse?: (url: string, response: Response) => void;
  onError?: (url: string, error: Error) => void;
};

let logger: HookLogger = {};

export const configureLogger = (customLogger: HookLogger) => {
  logger = customLogger;
};

/**
 * Global Configuration Types and Setup
 */
export interface HookGlobalConfig {
  headers?: Record<string, string>;
  mode?: RequestMode;
  credentials?: RequestCredentials;
}

let globalConfig: HookGlobalConfig = {};

export const configureGlobal = (config: HookGlobalConfig) => {
  globalConfig = { ...globalConfig, ...config };
};

/**
 * Utility to parse response based on Content-Type
 */
const parseResponse = async <T = any,>(response: Response): Promise<T> => {
  const contentType = response.headers.get("Content-Type");

  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  } else if (contentType?.includes("text/")) {
    return (await response.text()) as T;
  } else if (contentType?.includes("application/octet-stream")) {
    return (await response.arrayBuffer()) as T;
  } else if (contentType?.includes("application/blob")) {
    return (await response.blob()) as T;
  }

  return undefined as T; // Return undefined for unsupported content types
};

/**
 * Core Hook Function
 */
async function coreHook<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const mergedOptions: RequestInit = {
    ...globalConfig,
    ...options,
    headers: {
      ...globalConfig.headers, // Global headers
      ...options.headers, // Local headers
    },
  };

  try {
    logger.onRequest?.(url, mergedOptions);

    const response = await fetch(url, mergedOptions);

    logger.onResponse?.(url, response);

    if (!response.ok) {
      throw new Error(
        `[Hook] Request failed with status ${response.status}: ${response.statusText}`
      );
    }

    return await parseResponse<T>(response);
  } catch (error: any) {
    logger.onError?.(url, error);
    throw error;
  }
}

/**
 * HTTP Method Shortcuts
 */
const hook = {
  get: async <T = any,>(url: string, options: RequestInit = {}): Promise<T> =>
    coreHook<T>(url, { ...options, method: "GET" }),

  post: async <T = any,>(
    url: string,
    data: any = {},
    options: RequestInit = {}
  ): Promise<T> =>
    coreHook<T>(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }),

  put: async <T = any,>(
    url: string,
    data: any = {},
    options: RequestInit = {}
  ): Promise<T> =>
    coreHook<T>(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }),

  del: async <T = any,>(url: string, options: RequestInit = {}): Promise<T> =>
    coreHook<T>(url, { ...options, method: "DELETE" }),

  patch: async <T = any,>(
    url: string,
    data: any = {},
    options: RequestInit = {}
  ): Promise<T> =>
    coreHook<T>(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }),

  head: async <T = any,>(url: string, options: RequestInit = {}): Promise<T> =>
    coreHook<T>(url, { ...options, method: "HEAD" }),

  options: async <T = any,>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => coreHook<T>(url, { ...options, method: "OPTIONS" }),
};

export default hook;
