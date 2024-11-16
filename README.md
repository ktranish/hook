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
# Using npm
npm install @ktranish/hook

# Using pnpm
pnpm add @ktranish/hook
```

## Usage

### 1. Basic GET Request

```tsx
import hook from '@ktranish/hook';

const data = await hook.get('https://api.example.com/resource');
console.log(data);
```

### 2. POST Request with Data

```tsx
const newResource = await hook.post(
  'https://api.example.com/resource',
  { name: 'New Resource' }
);
console.log(newResource);
```

### 3. DELETE Request

```tsx
await hook.del('https://api.example.com/resource/1');
console.log('Resource deleted');
```

### 4. Handle Different Content Types

#### JSON Response

```tsx
const data = await hook.get('https://api.example.com/resource');
console.log(data); // JSON parsed data
```

#### Text Response

```tsx
const text = await hook.get<string>('https://api.example.com/plain-text');
console.log(text);
```

#### Binary Data

```tsx
const fileBuffer = await hook.get<ArrayBuffer>(
  'https://api.example.com/file',
  { headers: { Accept: 'application/octet-stream' } }
);
console.log(fileBuffer);
```

### 5. Global Configuration

You can set global headers, modes, or credentials for all requests:

```tsx
import { configureGlobal } from '@ktranish/hook';

configureGlobal({
  headers: { Authorization: 'Bearer token' },
  credentials: 'include',
});

const data = await hook.get('https://api.example.com/secure-resource');
console.log(data);
```

### 6. Lifecycle Logging

Hook provides logging hooks for requests, responses, and errors:

```tsx
import { configureLogger } from '@ktranish/hook';

configureLogger({
  onRequest: (url, options) => console.log(`[Request] ${url}`, options),
  onResponse: (url, response) => console.log(`[Response] ${url}`, response),
  onError: (url, error) => console.error(`[Error] ${url}`, error),
});

const data = await hook.get('https://api.example.com/resource');
console.log(data);
```

## API Reference

### Method Shortcuts

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
2. Create a new branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
