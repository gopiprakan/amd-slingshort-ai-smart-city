import { logError, logInfo, logWarning } from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const DEFAULT_TIMEOUT_MS = 10000;

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
};

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured.');
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { timeoutMs: _timeoutMs, ...fetchOptions } = options;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const message = payload?.error || payload?.message || `Request failed with status ${response.status}`;
      logWarning('API request failed', { path, status: response.status, message });
      throw new Error(message);
    }

    logInfo('API request succeeded', { path, status: response.status });
    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please try again.');
      logError('API request timed out', { path, timeoutMs });
      throw timeoutError;
    }

    logError('API request error', { path, message: error?.message });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
