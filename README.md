# Hook

>A lightweight HTTP client built on the Fetch API, designed for flexibility, configurability, and detailed lifecycle logging.

## About

**Hook** is a flexible HTTP library built directly on the Fetch API. It supports global and local configurations, lifecycle logging, and all HTTP methods, making it an ideal choice for applications that demand granular control over network requests. With TypeScript compatibility, hook ensures type safety and an enhanced developer experience.

## Features

- 🌐 **Flexible HTTP Methods**: Shortcuts like `hook.get`, `hook.post`, `hook.del`, etc.
- 🛡️ **Global Configuration**: Define default headers, mode, and credentials.
- 🔄 **Content-Type Detection**: Automatically parses JSON, text, binary, and more.
- 📈 **Lifecycle Logging**: Hook into request, response, and error events.
- 🛠️ **Lightweight**: Minimal overhead, dependency-free, and built on `fetch`.

## Installation

Install Hook via your preferred package manager:

```bash
# npm
npm install @ktranish/hook

# yarn
yarn add @ktranish/hook

# pnpm
pnpm add @ktranish/hook
```

## Usage

### 1. Basic GET Request

```tsx
import hook from '@ktranish/hook';

const fetchData = async () => {
  const data = await hook.get('https://api.example.com/resource');
  console.log(data);
};
```

### 2. POST Request with Data

```tsx
const createResource = async () => {
  const data = await hook.post('https://api.example.com/resource', { name: 'New Resource' });
  console.log(data);
};
```

### 3. Global Configuration

Configure global headers, credentials, or other fetch options:

```tsx
import { configureGlobal } from '@ktranish/hook';

configureGlobal({
  headers: { Authorization: 'Bearer your-token' },
  credentials: 'include',
});

await hook.get('https://api.example.com/resource');
```

### 4. Local Overrides

Override global configurations for specific requests:

```tsx
await hook.get('https://api.example.com/resource', {
  headers: { 'Custom-Header': 'CustomValue' }, // Overrides global headers
  cache: 'no-cache', // Specific to this request
});
```

### 5. Lifecycle Logging

#### Global Logging

Configure global loggers to track all HTTP requests:

```tsx
import { configureLogger } from '@ktranish/hook';

configureLogger({
  onRequest: (url, options) => console.log(`[Global Request] ${url}`, options),
  onResponse: (url, response) => console.log(`[Global Response] ${url}`, response),
  onError: (url, error) => console.error(`[Global Error] ${url}`, error),
});

await hook.get('https://api.example.com/resource'); // Automatically logged
```

#### Local Logging

Override global logging with a local logger:

```tsx
const localLogger = {
  onRequest: (url, options) => console.log(`[Local Request] ${url}`, options),
  onResponse: (url, response) => console.log(`[Local Response] ${url}`, response),
  onError: (url, error) => console.error(`[Local Error] ${url}`, error),
};

await hook.post(
  'https://api.example.com/resource',
  { name: 'New Resource' },
  { logger: localLogger }
);
```

### 6. Advanced Example: Combining Configurations and Logging

```tsx
import { configureGlobal, configureLogger } from '@ktranish/hook';

configureGlobal({
  headers: { Authorization: 'Bearer global-token' },
  credentials: 'include',
});

configureLogger({
  onRequest: (url, options) => console.log(`[Global Request] ${url}`, options),
  onResponse: (url, response) => console.log(`[Global Response] ${url}`, response),
  onError: (url, error) => console.error(`[Global Error] ${url}`, error),
});

const localLogger = {
  onRequest: (url, options) => console.log(`[Local Request] ${url}`, options),
  onResponse: (url, response) => console.log(`[Local Response] ${url}`, response),
};

await hook.get('https://api.example.com/resource', {
  headers: { 'Custom-Header': 'CustomValue' },
  logger: localLogger,
});
```

### 7. Custom Fetch Options

Hook supports all valid Fetch API options:

```tsx
await hook.get('https://api.example.com/resource', {
  cache: 'no-cache',
  redirect: 'manual',
  integrity: 'sha256-abcdef...',
});
```

## API Reference

### HTTP Method Shortcuts

- `hook.get<T>(url, options)`
- `hook.post<T>(url, data, options)`
- `hook.put<T>(url, data, options)`
- `hook.del<T>(url, options)` (alias for DELETE)
- `hook.patch<T>(url, data, options)`
- `hook.head<T>(url, options)`
- `hook.options<T>(url, options)`

### Parameters

| Parameter | Type          | Description                                         |
| --------- | ------------- | --------------------------------------------------- |
| `url`     | `string`      | The URL to send the HTTP request to.                |
| `options` | `RequestInit` | Options for `fetch` (e.g., headers, body, mode).    |
| `data`    | `any`         | The data to send with POST, PUT, or PATCH requests. |

## Testing

Hook includes a robust test suite to ensure reliability. Run the tests with:

```bash
npm test
```

Example Test

```tsx
import hook, { configureGlobal } from './hook';

describe('Hook Tests', () => {
  it('should perform a GET request successfully', async () => {
    const data = await hook.get('https://api.example.com/resource');
    expect(data).toBeDefined();
  });
});
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature-name`).
5. Open a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).
