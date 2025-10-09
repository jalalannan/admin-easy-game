/**
 * API Progress Bar Utilities
 * 
 * This module provides utilities to show a loading progress bar during API calls and route changes.
 * The progress bar appears at the top of the page with a smooth animation.
 * 
 * Route changes are automatically tracked by the ProgressBar component in the root layout.
 * For API calls, you have two options:
 * 
 * 1. Use `fetchWithProgress` as a drop-in replacement for `fetch`:
 *    ```
 *    const response = await fetchWithProgress('/api/endpoint', {
 *      method: 'POST',
 *      body: JSON.stringify(data)
 *    });
 *    ```
 * 
 * 2. Use `withProgress` to wrap any async function:
 *    ```
 *    const myFunction = withProgress(async () => {
 *      // Your async code here
 *    });
 *    ```
 */

import NProgress from 'nprogress';

/**
 * Wrapper around fetch that shows a progress bar during the request
 * Use this as a drop-in replacement for the native fetch function
 * 
 * @param input - The URL or Request object to fetch
 * @param init - The fetch init options
 * @returns Promise with the fetch response
 * 
 * @example
 * ```typescript
 * // Simple GET request
 * const response = await fetchWithProgress('/api/users');
 * 
 * // POST request with body
 * const response = await fetchWithProgress('/api/users/create', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'John' })
 * });
 * ```
 */
export async function fetchWithProgress(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  NProgress.start();
  try {
    const response = await fetch(input, init);
    return response;
  } finally {
    NProgress.done();
  }
}

/**
 * Higher-order function that wraps any async function with progress bar
 * Use this for custom async operations that aren't fetch calls
 * 
 * @param fn - Async function to wrap
 * @returns Wrapped function that shows progress bar during execution
 * 
 * @example
 * ```typescript
 * // Wrap a custom async function
 * const loadData = withProgress(async () => {
 *   const data = await someAsyncOperation();
 *   return processData(data);
 * });
 * 
 * // Call it normally
 * await loadData();
 * ```
 */
export function withProgress<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    NProgress.start();
    try {
      return await fn(...args);
    } finally {
      NProgress.done();
    }
  }) as T;
}

