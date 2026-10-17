// Central API client with token injection and error normalization.
const API_BASE = '/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request(method, path, { body, formData } = {}) {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body !== undefined) options.body = JSON.stringify(body);
  if (formData !== undefined) options.body = formData;

  const res = await fetch(`${API_BASE}${path}`, options);
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      if (contentType.includes('application/json')) {
        const data = await res.json();
        message = data.message || message;
      } else {
        message = await res.text();
      }
    } catch { /* ignore */ }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  if (contentType.includes('application/json')) return res.json();
  return res;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
  upload: (path, formData) => request('POST', path, { formData }),
  download: (path) => request('GET', path),
};

export function downloadFromUrl(path, filename) {
  // Browser download of a blob/report from the API (must include token via query-less fetch)
  const url = `${API_BASE}${path}`;
  fetch(url, { headers: { Authorization: `Bearer ${authToken}` } })
    .then((res) => {
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    })
    .then((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    })
    .catch((err) => alert(`Download failed: ${err.message}`));
}