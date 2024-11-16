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

    const data = await hook.get("https://jsonplaceholder.typicode.com/posts/1");
    expect(data).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts/1",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("should perform a POST request with data", async () => {
    const mockResponse = { id: 2 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    const data = await hook.post("https://jsonplaceholder.typicode.com/posts", {
      title: "New Post",
    });
    expect(data).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "New Post" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should perform a DELETE request", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(true, null));

    const data = await hook.del("https://jsonplaceholder.typicode.com/posts/1");
    expect(data).toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("should handle text responses", async () => {
    const mockResponse = "Hello, world!";
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, { "Content-Type": "text/plain" })
    );

    const data = await hook.get<string>("https://api.example.com/text");
    expect(data).toEqual(mockResponse);
  });

  it("should handle binary responses (arrayBuffer)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, null, {
        "Content-Type": "application/octet-stream",
      })
    );

    const data = await hook.get<ArrayBuffer>("https://api.example.com/file");
    expect(data).toBeInstanceOf(ArrayBuffer);
  });

  it("should throw an error for a failed request", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(
      hook.get("https://jsonplaceholder.typicode.com/posts/999")
    ).rejects.toThrow("[Hook] Request failed with status 404: Not Found");
  });

  it("should include global headers", async () => {
    configureGlobal({ headers: { Authorization: "Bearer token" } });

    const mockResponse = { id: 1 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    const data = await hook.get("https://api.example.com/resource");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      })
    );
  });

  it("should merge local and global headers", async () => {
    configureGlobal({ headers: { Authorization: "Bearer token" } });

    const mockResponse = { id: 1 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    const data = await hook.get("https://api.example.com/resource", {
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

  it("should log requests and responses", async () => {
    const logger = {
      onRequest: jest.fn(),
      onResponse: jest.fn(),
      onError: jest.fn(),
    };
    configureLogger(logger);

    const mockResponse = { id: 1 };
    (fetch as jest.Mock).mockResolvedValueOnce(
      createMockResponse(true, mockResponse, {
        "Content-Type": "application/json",
      })
    );

    const data = await hook.get("https://api.example.com/resource");
    expect(logger.onRequest).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.any(Object)
    );
    expect(logger.onResponse).toHaveBeenCalledWith(
      "https://api.example.com/resource",
      expect.any(Object)
    );
    expect(logger.onError).not.toHaveBeenCalled();
  });

  it("should log errors", async () => {
    const logger = {
      onRequest: jest.fn(),
      onResponse: jest.fn(),
      onError: jest.fn(),
    };
    configureLogger(logger);

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    await expect(hook.get("https://api.example.com/failing")).rejects.toThrow(
      "Network Error"
    );
    expect(logger.onError).toHaveBeenCalledWith(
      "https://api.example.com/failing",
      expect.any(Error)
    );
  });
});
