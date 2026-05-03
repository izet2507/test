const BASE = '/api';

async function request(method, url, body) {
  const opts = { method, headers: {} };
  if (body && !(body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    opts.body = body;
  }
  const res = await fetch(BASE + url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  delete: (url) => request('DELETE', url),

  uploadFile: (formData) => request('POST', '/files/upload', formData),
  downloadUrl: (id) => `${BASE}/files/download/${id}`,

  stats: () => request('GET', '/stats'),
  search: (q) => request('GET', `/search?q=${encodeURIComponent(q)}`),
};
