import hook, {
  configureGlobal,
  configureLogger,
  getAnalytics,
  resetAnalytics,
} from "./";

// Mock fetch globally for tests
globalThis.fetch = jest.fn();

// Utility to create mock fetch responses
const createMockResponse = (
  ok: boolean,
  body: any,
  headers: Record<string, string> = {}
) => ({
  ok,
  json: async () => body,
  text: async () => body,
  arrayBuffer: async () => new ArrayBuffer(8),
  blob: async () => new Blob(),
  headers: {
    get: (name: string) => headers[name] || null,
  },
  status: ok ? 200 : 400,
  statusText: ok ? "OK" : "Bad Request",
});

describe("Hook Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAnalytics();
  });

  it("should perform a GET request", async () => {
    const mockResponse = { id: 1 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    const data = await hook.get<{ id: number }>(
      "https://api.example.com/resource"
    );
    expect(data).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.objectContaining({ method: "GET" })
    );

    const analytics = getAnalytics();
    expect(analytics.totalRequests).toBe(1);
    expect(analytics.requestMethods.GET).toBe(1);
  });

  it("should log and update analytics for failed requests", async () => {
    const localLogger = {
      onRequest: jest.fn(),
      onResponse: jest.fn(),
      onError: jest.fn(),
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(
      hook.get("https://api.example.com/not-found", { logger: localLogger })
    ).rejects.toThrow("[Hook] Request failed with status 404: Not Found");

    expect(localLogger.onError).toHaveBeenCalledWith(
      "https://api.example.com/not-found",
      expect.any(Error)
    );

    const analytics = getAnalytics();
    expect(analytics.failedRequests).toBe(1);
    expect(analytics.errorCodes["404"]).toBe(1);
  });

  it("should correctly handle text responses", async () => {
    const mockResponse = "Hello, world!";
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, { "Content-Type": "text/plain" })
    );

    const data = await hook.get<string>("https://api.example.com/text");
    expect(data).toEqual(mockResponse);

    const analytics = getAnalytics();
    expect(analytics.totalRequests).toBe(1);
  });

  it("should correctly merge global and local headers", async () => {
    configureGlobal({ headers: { Authorization: "Bearer global-token" } });

    const mockResponse = { id: 2 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    await hook.get("https://api.example.com/resource", {
      headers: { "Custom-Header": "CustomValue" },
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer global-token",
          "Custom-Header": "CustomValue",
        }),
      })
    );
  });

  it("should track analytics for multiple request types", async () => {
    const mockGetResponse = { id: 1 };
    const mockPostResponse = { id: 2 };

    (fetch as jest.Mock)
      .mockResolvedValueOnce(
        createMockResponse(true, mockGetResponse, {
          "Content-Type": "application/json",
        })
      )
      .mockResolvedValueOnce(
        createMockResponse(true, mockPostResponse, {
          "Content-Type": "application/json",
        })
      );

    await hook.get("https://api.example.com/resource");
    await hook.post("https://api.example.com/resource", {
      name: "New Resource",
    });

    const analytics = getAnalytics();
    expect(analytics.totalRequests).toBe(2);
    expect(analytics.requestMethods.GET).toBe(1);
    expect(analytics.requestMethods.POST).toBe(1);
  });

  it("should handle global logger", async () => {
    const globalLogger = {
      onRequest: jest.fn(),
      onResponse: jest.fn(),
      onError: jest.fn(),
    };

    configureLogger(globalLogger);

    const mockResponse = { id: 3 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    await hook.get("https://api.example.com/resource");

    expect(globalLogger.onRequest).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.any(Object)
    );
    expect(globalLogger.onResponse).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.any(Object)
    );

    const analytics = getAnalytics();
    expect(analytics.totalRequests).toBe(1);
  });

  it("should handle unsupported response types gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, null, { "Content-Type": "unsupported/type" })
    );

    await expect(
      hook.get("https://api.example.com/unsupported")
    ).rejects.toThrow(
      "[Hook] Unsupported response content type: unsupported/type"
    );
  });

  it("should reset analytics", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(
        true,
        { id: 1 },
        { "Content-Type": "application/json" }
      )
    );

    await hook.get("https://api.example.com/resource");

    const analyticsBeforeReset = getAnalytics();
    expect(analyticsBeforeReset.totalRequests).toBe(1);

    resetAnalytics();

    const analyticsAfterReset = getAnalytics();
    expect(analyticsAfterReset.totalRequests).toBe(0);
  });
});
