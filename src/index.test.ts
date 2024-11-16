import hook, { configureGlobal, configureLogger } from "./";

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
  });

  it("should throw an error for unsupported response content types", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, null, { "Content-Type": "unsupported/type" })
    );

    await expect(
      hook.get("https://api.example.com/unsupported")
    ).rejects.toThrow(
      "[Hook] Unsupported response content type: unsupported/type"
    );
  });

  it("should perform a POST request with data", async () => {
    const mockResponse = { id: 2 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    const data = await hook.post("https://api.example.com/resource", {
      name: "New Resource",
    });
    expect(data).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "New Resource" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should support global logger", async () => {
    const globalLogger = {
      onRequest: jest.fn(),
      onResponse: jest.fn(),
      onError: jest.fn(),
    };

    configureLogger(globalLogger);

    const mockResponse = { id: 6 };
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
    expect(globalLogger.onError).not.toHaveBeenCalled();
  });

  it("should merge global and local headers", async () => {
    configureGlobal({ headers: { Authorization: "Bearer token" } });

    const mockResponse = { id: 4 };
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
          Authorization: "Bearer token",
          "Custom-Header": "CustomValue",
        }),
      })
    );
  });

  it("should log errors using a local logger", async () => {
    const localLogger = {
      onRequest: jest.fn(),
      onResponse: jest.fn(),
      onError: jest.fn(),
    };

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    await expect(
      hook.get("https://api.example.com/failing", { logger: localLogger })
    ).rejects.toThrow("Network Error");

    expect(localLogger.onError).toHaveBeenCalledWith(
      "https://api.example.com/failing",
      expect.any(Error)
    );
  });

  it("should correctly handle text responses", async () => {
    const mockResponse = "Hello, world!";
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, { "Content-Type": "text/plain" })
    );

    const data = await hook.get<string>("https://api.example.com/text");
    expect(data).toEqual(mockResponse);
  });

  it("should correctly handle binary responses (arrayBuffer)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, null, {
        "Content-Type": "application/octet-stream",
      })
    );

    const data = await hook.get<ArrayBuffer>("https://api.example.com/file");
    expect(data).toBeInstanceOf(ArrayBuffer);
  });

  it("should handle global headers", async () => {
    configureGlobal({ headers: { Authorization: "Bearer token" } });

    const mockResponse = { id: 3 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    await hook.get("https://api.example.com/resource");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      })
    );
  });

  it("should throw an error for failed requests", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(hook.get("https://api.example.com/not-found")).rejects.toThrow(
      "[Hook] Request failed with status 404: Not Found"
    );
  });
});
