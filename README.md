# Hook

**Hook** is a lightweight TypeScript library for managing HTTP requests with built-in error handling, retries, logging, and webhook management. Designed to simplify and standardize request handling in JavaScript/TypeScript applications, Hook ensures robust and maintainable solutions for modern web development.

## Features

- 🔄 Retry Logic: Automatically retries failed requests with customizable attempts and delays.
- 🚨 Error Handling: Catch, log, and process errors consistently.
- 📈 Logging: Centralized logging for request success, failures, and retries.
- 🔗 Webhook Management: Trigger webhook events for request statuses or custom logic.

## Installation

Install Hook via your preferred package manager:

```bash
# Using npm
npm install @your-username/hook

# Using pnpm
pnpm add @your-username/hook
```

## Usage

### Basic Usage

Send a simple HTTP request:

```tsx
import { hook } from '@ktranish/hook';

async function fetchData() {
  const data = await hook('https://jsonplaceholder.typicode.com/posts/1');
  console.log('Received Data:', data);
}

fetchData();
```

### Custom Retry Logic

Handle transient errors with retries and delays:

```tsx
import { hook } from '@your-username/hook';

async function fetchWithRetries() {
  try {
    const data = await hook('https://jsonplaceholder.typicode.com/invalid-url', {}, 3, 2000);
    console.log('Received Data:', data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

fetchWithRetries();
```

### Webhook Integration

Trigger webhook events for request statuses:

```tsx
import { hook } from '@your-username/hook';

const webhookHandler = (eventName: string, payload: any) => {
  console.log(`[Webhook] Event: ${eventName}`, payload);
};

async function fetchWithWebhook() {
  const data = await hook(
    'https://jsonplaceholder.typicode.com/posts/1',
    {},
    3,
    1000,
    webhookHandler
  );
  console.log('Received Data:', data);
}

fetchWithWebhook();
```

### API Reference

`hook<T = any>(url: string, options?: AxiosRequestConfig, retries?: number, delay?: number, webhookHandler?: (eventName: string, payload: any) => void): Promise<T>`

Parameters:

`url` *(string)*: The endpoint URL for the request.
`options` *(AxiosRequestConfig)*: Optional configuration for the request.
`retries` *(number)*: Number of retry attempts for failed requests (default: 3).
`delay` *(number)*: Delay between retries in milliseconds (default: 1000).
`webhookHandler` *(function)*: Optional function to handle webhook events.
Returns:
- A `Promise` that resolves with the response data.

## Testing

Hook includes a robust test suite. Run the tests with:

```bash
npm test
```

Sample test structure:

```tsx
import { hook } from './src/hook';

describe('hook', () => {
  it('should fetch data successfully', async () => {
    const data = await hook('https://jsonplaceholder.typicode.com/posts/1');
    expect(data).toHaveProperty('id', 1);
  });

  it('should retry on failure and eventually throw', async () => {
    const failingUrl = 'https://invalid-url.com';
    await expect(hook(failingUrl, {}, 2, 500)).rejects.toThrow();
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
