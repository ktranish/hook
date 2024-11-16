/**
 * Logger Types and Configuration
 */
export type HookLogger = {
  onRequest?: (url: string, options: RequestInit) => void | Promise<void>;
  onResponse?: (url: string, response: Response) => void | Promise<void>;
  onError?: (url: string, error: Error) => void | Promise<void>;
};

let globalLogger: Readonly<HookLogger> = {};

export const configureLogger = (customLogger: HookLogger) => {
  globalLogger = Object.freeze(customLogger); // Prevent mutations
};

/**
 * Global Configuration Types and Setup
 */
export type HookGlobalConfig = Readonly<RequestInit>;

let globalConfig: HookGlobalConfig = {};

export const configureGlobal = (config: HookGlobalConfig) => {
  globalConfig = Object.freeze({ ...globalConfig, ...config }); // Prevent mutations
};

/**
 * Hook Options (Extend RequestInit to Include Local Logger)
 */
export interface HookOptions extends RequestInit {
  logger?: HookLogger; // Optional local logger
}

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

  throw new Error(`[Hook] Unsupported response content type: ${contentType}`);
};

/**
 * Core Hook Function
 */
async function coreHook<T = any>(
  url: string,
  options: HookOptions = {}
): Promise<T> {
  const localLogger = options.logger || globalLogger; // Use local logger if provided
  const mergedOptions: RequestInit = {
    ...globalConfig, // Apply global configuration
    ...options, // Apply local options
    headers: {
      ...globalConfig.headers, // Merge global headers
      ...options.headers, // Merge local headers
    },
  };

  try {
    await localLogger.onRequest?.(url, mergedOptions);

    const response = await fetch(url, mergedOptions);

    await localLogger.onResponse?.(url, response);

    if (!response.ok) {
      throw new Error(
        `[Hook] Request failed with status ${response.status}: ${response.statusText}`
      );
    }

    return await parseResponse<T>(response);
  } catch (error: any) {
    await localLogger.onError?.(url, error);
    throw error;
  }
}

/**
 * HTTP Method Shortcuts
 */
const hook = {
  get: async <T = any,>(url: string, options: HookOptions = {}): Promise<T> =>
    coreHook<T>(url, { ...options, method: "GET" }),

  post: async <T = any,>(
    url: string,
    data: Record<string, any>,
    options: HookOptions = {}
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
    data: Record<string, any>,
    options: HookOptions = {}
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

  del: async <T = any,>(url: string, options: HookOptions = {}): Promise<T> =>
    coreHook<T>(url, { ...options, method: "DELETE" }),

  patch: async <T = any,>(
    url: string,
    data: Record<string, any>,
    options: HookOptions = {}
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

  head: async <T = any,>(url: string, options: HookOptions = {}): Promise<T> =>
    coreHook<T>(url, { ...options, method: "HEAD" }),

  options: async <T = any,>(
    url: string,
    options: HookOptions = {}
  ): Promise<T> => coreHook<T>(url, { ...options, method: "OPTIONS" }),
};

export default hook;
