let authToken = null;

export function setToken(token) {
  authToken = token;
}

export function getToken() {
  if (!authToken) {
    try { authToken = sessionStorage.getItem('jlab_token'); } catch (_) {}
  }
  return authToken;
}

export async function apiCall(action, payload = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/admin', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, payload })
  });

  if (res.status === 401) {
    try { sessionStorage.removeItem('jlab_token'); } catch (_) {}
    window.location.href = '/admin';
    throw new Error('登入已過期');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

export const sbGet = (p) => apiCall('db', { path: p });
export const sbPost = (t, d) => apiCall('db', { path: t, method: 'POST', body: d });
export const sbPatch = (p, d) => apiCall('db', { path: p, method: 'PATCH', body: d });
export const sbDel = (p) => apiCall('db', { path: p, method: 'DELETE' });
