# Hook

**Hook** is an enterprise-ready, lightweight TypeScript library for managing HTTP requests with built-in retry logic, circuit breaker functionality, customizable configurations, and robust logging. Designed to scale for both small and large applications, Hook provides a flexible and intuitive API for reliable HTTP communication.

## Features

- 🌐 **HTTP Method Shortcuts**: Intuitive methods like hook.get, hook.post, hook.del, etc.
- 🔄 **Retry Logic**: Configurable retry attempts and delays with custom retry conditions.
- 🛡️ **Circuit Breaker**: Automatically prevents repeated failures during outages.
- 📈 **Detailed Logging**: Hook into request, response, and error events for debugging and monitoring.
- ⚙️ **Global Configuration**: Set global defaults for headers, retries, delays, and more.
- 🛠️ **Lightweight and Maintainable**: Focused on reliability and scalability for long-term use.

## Installation

Install Hook via your preferred package manager:

```bash
# Using npm
npm install @ktranish/hook

# Using pnpm
pnpm add @ktranish/hook
```

## Usage

### 1. Basic GET Request

Send a simple HTTP request:

```tsx
import hook from '@ktranish/hook';

const data = await hook.get('https://jsonplaceholder.typicode.com/posts/1');
console.log(data);
```

### 2. POST Request with Data

Handle transient errors with retries and delays:

```tsx
const newPost = await hook.post(
  'https://jsonplaceholder.typicode.com/posts',
  { title: 'New Post', content: 'Hello World' }
);
console.log(newPost);
```

### 3. DELETE Request

Trigger webhook events for request statuses:

```tsx
await hook.del('https://jsonplaceholder.typicode.com/posts/1');
console.log('Post deleted');
```

### 4. Global Configuration

You can configure global defaults for headers, retries, and delays:

```tsx
import hook, { configureGlobal } from '@ktranish/hook';

configureGlobal({
  headers: { Authorization: 'Bearer global-token' },
  retries: 5,
  delay: 2000,
});

const data = await hook.get('https://api.example.com/resource');
console.log(data);
```

### 5. Logging Requests, Responses, and Errors

Hook provides lifecycle hooks to log request details:

```tsx
import hook, { configureLogger } from '@ktranish/hook';

configureLogger({
  onRequest: (url, options) => console.log(`[Request] ${url}`, options),
  onResponse: (url, response) => console.log(`[Response] ${url}`, response),
  onError: (url, error) => console.error(`[Error] ${url}`, error),
});

const data = await hook.get('https://api.example.com/resource');
console.log(data);
```

### 6. Retry Logic with Custom Conditions

By default, Hook retries on server errors (`>=500`). You can configure custom retry conditions:

```tsx
import hook, { configureRetryCondition } from '@ktranish/hook';

configureRetryCondition((error) => {
  return error.response?.status === 429; // Retry only on rate-limiting errors
});

const data = await hook.get('https://api.example.com/resource');
console.log(data);
```

### 7. Circuit Breaker for Reliability

Hook includes a built-in circuit breaker to prevent repeated failures during outages:

```tsx
try {
  const data = await hook.get('https://unstable-api.example.com/resource');
  console.log(data);
} catch (error) {
  console.error('Request failed:', error.message);
}
```

## API Reference

`hook<T = any>(url: string, options?: AxiosRequestConfig, retries?: number, delay?: number, webhookHandler?: (eventName: string, payload: any) => void): Promise<T>`

### Method Shortcuts

- `hook.get(url, options)`
- `hook.post(url, data, options)`
- `hook.put(url, data, options)`
- `hook.del(url, options) (alias for DELETE)`
- `hook.patch(url, data, options)`
- `hook.head(url, options)`
- `hook.options(url, options)`

### Configuration Functions

| Function                                 | Description                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------|
| configureGlobal(config)                  | Set global defaults for headers, retries, delays, etc.                      |
| configureLogger(logger)                  | Add hooks for logging requests, responses, and errors.                      |
| configureRetryCondition(condition)       | Define a custom retry condition (e.g., based on HTTP status or error type). |

### Parameters

| Parameter | Type                 | Default    | Description                                         |
| --------- | -------------------- | ---------- | --------------------------------------------------- |
| `url`     | `string`             | `Required` | The URL to send the HTTP request to.                |
| `options` | `AxiosRequestConfig` | `{}`       | Axios options (headers, query params, etc.).        |
| `data`    | `any`                | `{}`       | The data to send with POST, PUT, or PATCH requests. |
| `retries` | `number`             | `3`        | The number of retry attempts for failed requests.   |
| `delay`   | `number`             | `1000`     | Delay in milliseconds between retries.              |

## Testing

Hook includes a robust test suite. Run the tests with:

```bash
npm test
```

Sample test structure:

```tsx
import hook from './src/hook';

describe('Hook Tests', () => {
  it('should perform a GET request', async () => {
    const data = await hook.get('https://jsonplaceholder.typicode.com/posts/1');
    expect(data).toHaveProperty('id', 1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const data = await hook.get('https://jsonplaceholder.typicode.com/failing-url', {}, 3, 1000);
    expect(data).toBeDefined();
  });
});
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
