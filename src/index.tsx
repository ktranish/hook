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
 * Analytics Types and Storage
 */
type AnalyticsData = {
  totalRequests: number;
  requestMethods: Record<string, number>;
  averageResponseTime: number;
  successfulRequests: number;
  failedRequests: number;
  errorCodes: Record<string, number>;
  responseTimes: number[];
};

const analytics: AnalyticsData = {
  totalRequests: 0,
  requestMethods: {},
  averageResponseTime: 0,
  successfulRequests: 0,
  failedRequests: 0,
  errorCodes: {},
  responseTimes: [],
};

/**
 * Update analytics after each request
 */
const updateAnalytics = (
  method: string,
  status: number,
  responseTime: number
) => {
  analytics.totalRequests += 1;
  analytics.requestMethods[method] =
    (analytics.requestMethods[method] || 0) + 1;
  analytics.responseTimes.push(responseTime);

  if (status >= 200 && status < 300) {
    analytics.successfulRequests += 1;
  } else {
    analytics.failedRequests += 1;
    analytics.errorCodes[status] = (analytics.errorCodes[status] || 0) + 1;
  }

  const totalResponseTime = analytics.responseTimes.reduce(
    (sum, time) => sum + time,
    0
  );
  analytics.averageResponseTime =
    totalResponseTime / analytics.responseTimes.length;
};

/**
 * Expose analytics API
 */
export const getAnalytics = () => ({ ...analytics });
export const resetAnalytics = () => {
  analytics.totalRequests = 0;
  analytics.requestMethods = {};
  analytics.averageResponseTime = 0;
  analytics.successfulRequests = 0;
  analytics.failedRequests = 0;
  analytics.errorCodes = {};
  analytics.responseTimes = [];
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
  const method = options.method || "GET";

  const mergedOptions: RequestInit = {
    ...globalConfig, // Apply global configuration
    ...options, // Apply local options
    headers: {
      ...globalConfig.headers, // Merge global headers
      ...options.headers, // Merge local headers
    },
  };

  const startTime = performance.now();

  try {
    await localLogger.onRequest?.(url, mergedOptions);

    const response = await fetch(url, mergedOptions);

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    if (!response.ok) {
      // Single point for failed analytics update
      updateAnalytics(method, response.status, responseTime);
      throw new Error(
        `[Hook] Request failed with status ${response.status}: ${response.statusText}`
      );
    }

    // Analytics for successful responses
    updateAnalytics(method, response.status, responseTime);

    await localLogger.onResponse?.(url, response);
    return await parseResponse<T>(response);
  } catch (error: any) {
    // Log the error but do not update analytics
    await localLogger.onError?.(url, error);

    throw error; // Re-throw for external handling
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
