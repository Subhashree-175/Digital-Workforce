// Central API client with token injection and error normalization.

// Production:
// https://digital-workforce.onrender.com

// Local development:
// Uses the Vite proxy through /api

const API_BASE = (
  import.meta.env.VITE_API_URL || ''
).replace(/\/+$/, '');

const API_PREFIX = '/api';

let authToken = null;

// Set authentication token
export function setAuthToken(token) {
  authToken = token;
}

// Get authentication token
export function getAuthToken() {
  return authToken;
}

// Normalize API paths to prevent missing or duplicate /api prefixes
function normalizeApiPath(path) {
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  if (
    normalizedPath === API_PREFIX ||
    normalizedPath.startsWith(`${API_PREFIX}/`)
  ) {
    return normalizedPath;
  }

  return `${API_PREFIX}${normalizedPath}`;
}

// Build complete API URL
function buildApiUrl(path) {
  return `${API_BASE}${normalizeApiPath(path)}`;
}

// Common request handler
async function request(method, path, { body, formData } = {}) {
  const headers = {};

  // Add authentication token if available
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // Set JSON content type when sending JSON data
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
  };

  // Attach JSON body
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  // Attach FormData without setting Content-Type manually
  if (formData !== undefined) {
    options.body = formData;
  }

  const url = buildApiUrl(path);

  const res = await fetch(url, options);

  const contentType = res.headers.get('content-type') || '';

  // Normalize API errors
  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    try {
      if (contentType.includes('application/json')) {
        const data = await res.json();
        message = data.message || message;
      } else {
        const text = await res.text();

        if (text) {
          message = text;
        }
      }
    } catch {
      // Ignore response parsing errors
    }

    const error = new Error(message);
    error.status = res.status;

    throw error;
  }

  // Return JSON for JSON responses
  if (contentType.includes('application/json')) {
    return res.json();
  }

  return res;
}

// API methods
export const api = {
  get: (path) => request('GET', path),

  post: (path, body) =>
    request('POST', path, { body }),

  put: (path, body) =>
    request('PUT', path, { body }),

  del: (path) =>
    request('DELETE', path),

  upload: (path, formData) =>
    request('POST', path, { formData }),

  download: (path) =>
    request('GET', path),
};

// Download files with authentication
export function downloadFromUrl(path, filename) {
  const url = buildApiUrl(path);

  fetch(url, {
    headers: {
      ...(authToken
        ? { Authorization: `Bearer ${authToken}` }
        : {}),
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }

      return res.blob();
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
    })
    .catch((err) => {
      alert(`Download failed: ${err.message}`);
    });
}